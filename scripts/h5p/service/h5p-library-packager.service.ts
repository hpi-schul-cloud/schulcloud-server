import { ILibraryName, LibraryName } from '@lumieducation/h5p-server';
import { IFullLibraryName } from '@lumieducation/h5p-server/build/src/types';
import { spawnSync, SpawnSyncOptions } from 'child_process';
import { FileSystemHelper } from '../helper/file-system.helper';
import { h5pLogger, LogLevel } from '../helper/h5p-logger.helper';
import { H5PLibrary } from '../interface/h5p-library';
import { H5PSemanticField } from '../interface/h5p-semantics';
import { H5pConsistencyChecker } from './h5p-consistency-checker.service';
import { H5pGitHubClient, LibraryRepoMap } from './h5p-github.client';
import { H5pHubClient } from './h5p-hub.client';

export class H5pLibraryPackagerService {
	tempFolderPath: string;
	gitHubClient: H5pGitHubClient;
	h5pHubClient: H5pHubClient;
	consistencyChecker: H5pConsistencyChecker;
	private readonly logger = h5pLogger;
	availableVersions: string[] = [];
	installedLibraries: Set<string> = new Set();
	failedLibraries: Set<string> = new Set();
	skippedLibraries: Set<string> = new Set();

	constructor(libraryRepoMap: LibraryRepoMap, tempFolderPath?: string) {
		if (!tempFolderPath) {
			const tempDir = FileSystemHelper.getTempDir();
			this.tempFolderPath = FileSystemHelper.buildPath(tempDir, 'h5p-libraries');
		} else {
			this.tempFolderPath = tempFolderPath;
		}
		if (!FileSystemHelper.pathExists(this.tempFolderPath)) {
			FileSystemHelper.createFolder(this.tempFolderPath);
		}

		this.gitHubClient = new H5pGitHubClient(libraryRepoMap);
		this.h5pHubClient = new H5pHubClient();
		this.consistencyChecker = new H5pConsistencyChecker();
	}

	public setLogLevel(level: LogLevel): void {
		this.logger.setLogLevel(level);
	}

	public async buildH5pLibrariesFromGitHubAsBulk(libraries: string[]): Promise<void> {
		this.availableVersions = [];
		this.installedLibraries = new Set();
		this.failedLibraries = new Set();
		this.skippedLibraries = new Set();
		this.gitHubClient.clearTagsCache();
		this.h5pHubClient.clearVersionCache();
		this.logger.resetIndent();

		for (const library of libraries) {
			this.logger.banner(library);
			await this.buildLibrary(library);
		}

		this.logFinalSummary();
	}

	private logFinalSummary(): void {
		this.logger.summary('Build Summary', [
			{ label: 'Built:', value: this.installedLibraries.size },
			{ label: 'Skipped:', value: this.skippedLibraries.size },
			{ label: 'Failed:', value: this.failedLibraries.size },
		]);

		if (this.installedLibraries.size > 0) {
			this.logger.info(`Installed: ${this.logger.formatLibraryList(this.installedLibraries)}`);
		}
		if (this.failedLibraries.size > 0) {
			this.logger.info(`Failed: ${this.logger.formatLibraryList(this.failedLibraries)}`);
		}
	}

	private async buildLibrary(library: string): Promise<void> {
		const repoName = this.gitHubClient.mapMachineNameToGitHubRepo(library);
		if (!repoName) {
			this.logger.failure(`No GitHub repository mapping for ${library}`);

			return;
		}
		const tags = await this.gitHubClient.fetchAllTags(repoName);
		let filteredTags = this.getHighestPatchTags(tags);

		try {
			const currentH5pHubTag = await this.h5pHubClient.getCurrentVersion(library);
			const beforeCount = filteredTags.length;
			filteredTags = this.filterTagsByH5pHubVersion(filteredTags, currentH5pHubTag);
			const hubVersion = `${currentH5pHubTag.majorVersion}.${currentH5pHubTag.minorVersion}.${currentH5pHubTag.patchVersion}`;
			this.logger.info(`Hub version: ${hubVersion} (excluded ${beforeCount - filteredTags.length} newer versions)`);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			this.logger.warn(`Could not get Hub version: ${message}`);
		}

		if (filteredTags.length === 0) {
			this.logger.info('No versions to build');

			return;
		}

		this.logger.info(`Building ${filteredTags.length} version(s): ${filteredTags.join(', ')}`);

		for (const tag of filteredTags) {
			this.logger.indent();
			await this.buildLibraryVersionAndDependencies(library, tag, repoName);
			this.logger.dedent();
		}
	}

	private filterTagsByH5pHubVersion(tags: string[], currentH5pHubTag: IFullLibraryName): string[] {
		const filteredTags = tags.filter((tag) => {
			const { major, minor, patch } = this.parseTagVersion(tag);

			// Compare major version first
			if (major < currentH5pHubTag.majorVersion) return true;
			if (major > currentH5pHubTag.majorVersion) {
				return false;
			}

			// Major versions are equal, compare minor version
			if (minor < currentH5pHubTag.minorVersion) return true;
			if (minor > currentH5pHubTag.minorVersion) {
				return false;
			}

			if (patch < currentH5pHubTag.patchVersion) return true;

			// If versions are equal or tag is greater, exclude it
			return false;
		});

		return filteredTags;
	}

	private getHighestPatchTags(tags: string[]): string[] {
		const semverRegex = /^v?(\d+)\.(\d+)(?:\.(\d+))?$/;
		const versionMap = new Map<string, { tag: string; patch: number }>();
		for (const tag of tags) {
			const match = tag.match(semverRegex);
			if (!match) continue;
			const [, major, minor, patch] = match;
			const key = `${major}.${minor}`;
			const patchNum = patch ? parseInt(patch, 10) : 0;
			const existing = versionMap.get(key);
			if (!existing || patchNum > existing.patch) {
				versionMap.set(key, { tag, patch: patchNum });
			}
		}
		const highestPatchTags = Array.from(versionMap.values()).map((v) => v.tag);

		return highestPatchTags;
	}

	private async buildLibraryVersionAndDependencies(
		library: string,
		tag: string,
		repoName: string,
		useMasterBranch = false
	): Promise<boolean> {
		const libVersion = `${library}-${tag}`;

		if (this.isCurrentVersionAvailable(library, tag)) {
			this.skippedLibraries.add(libVersion);

			return true;
		}
		if (this.isNewerPatchVersionAvailable(library, tag)) {
			this.skippedLibraries.add(libVersion);

			return true;
		}
		if (this.isAlreadyFailed(library, tag)) return false;

		const sourceLabel = useMasterBranch ? `${libVersion} (from master)` : libVersion;
		this.logger.log(sourceLabel);
		this.logger.indent();

		const validLibrary = await this.buildLibraryTagFromGitHub(library, tag, repoName, useMasterBranch);
		if (validLibrary) {
			this.installedLibraries.add(libVersion);
			this.logger.success('Built successfully');
		} else {
			this.failedLibraries.add(libVersion);
			this.logger.failure('Build failed');
			this.logger.dedent();

			return false;
		}
		this.availableVersions.push(libVersion);

		const dependencies = this.collectAllDependencies(library, tag);
		if (dependencies.length === 0) {
			this.logger.dedent();

			return true;
		}

		this.logger.log(`Dependencies (${dependencies.length}):`);
		this.logger.indent();
		for (const dependency of dependencies) {
			await this.buildLibraryDependency(dependency);
		}
		this.logger.dedent();
		this.logger.dedent();

		return true;
	}

	private collectAllDependencies(library: string, tag: string): ILibraryName[] {
		const dependencies = this.getDependenciesFromLibraryJson(library, tag);
		const softDependencies = this.getSoftDependenciesFromSemantics(library, tag);

		return dependencies.concat(softDependencies);
	}

	private async buildLibraryTagFromGitHub(
		library: string,
		tag: string,
		repo: string,
		useMasterBranch = false
	): Promise<boolean> {
		const { filePath, folderPath, tempFolder } = FileSystemHelper.createTempFolder(this.tempFolderPath, library, tag);

		try {
			if (useMasterBranch) {
				await this.gitHubClient.downloadBranch(repo, 'master', filePath);
			} else {
				await this.gitHubClient.downloadTag(repo, tag, filePath);
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			this.logger.error(`Download failed: ${message}`);

			return false;
		}

		if (FileSystemHelper.pathExists(folderPath)) {
			FileSystemHelper.removeFolder(folderPath);
		}
		FileSystemHelper.unzipAndRenameFolder(filePath, folderPath, tempFolder);
		FileSystemHelper.removeFile(filePath);

		const buildSuccess = this.executeAdditionalBuildStepsIfRequired(folderPath, library, tag);
		if (!buildSuccess) {
			return false;
		}

		this.cleanUpUnwantedFilesInLibraryFolder(folderPath);

		const validated = this.consistencyChecker.checkConsistency(folderPath);

		return validated;
	}

	private executeAdditionalBuildStepsIfRequired(folderPath: string, library: string, tag: string): boolean {
		this.checkAndCorrectLibraryJsonVersion(folderPath, tag);

		if (this.isPrependNodeOptionsRequired(library, tag)) {
			this.prependNodeOptionsToRunScript(folderPath);
		}

		if (!this.isShepherdLibrary(library) && this.areBuildStepsRequired(folderPath)) {
			const legacyPeerDepsRequired = this.isLegacyPeerDepsRequired(library, tag);
			const oldNodeVersion = this.isOldNodeVersionRequired(library, tag);
			const installRequired = this.isInstallRequiredInsteadOfCi(library, tag);
			const buildSuccess = this.executeBuildSteps(folderPath, legacyPeerDepsRequired, oldNodeVersion, installRequired);
			if (!buildSuccess) {
				return false;
			}
		}

		if (this.isLibraryPathCorrectionRequired(library, tag)) {
			this.checkAndCorrectLibraryJsonPaths(folderPath);
		}

		return true;
	}

	private checkAndCorrectLibraryJsonVersion(folderPath: string, tag: string): boolean {
		const libraryJsonPath = FileSystemHelper.getLibraryJsonPath(folderPath);
		let changed = false;
		try {
			const json = FileSystemHelper.readLibraryJson(libraryJsonPath);
			const { major: tagMajor, minor: tagMinor, patch: tagPatch } = this.parseTagVersion(tag);
			if (json.majorVersion !== tagMajor || json.minorVersion !== tagMinor || json.patchVersion !== tagPatch) {
				json.majorVersion = tagMajor;
				json.minorVersion = tagMinor;
				json.patchVersion = tagPatch;
				FileSystemHelper.writeJsonFile(libraryJsonPath, json);
				changed = true;
				this.logCorrectedVersionInLibraryJson(folderPath, tag);
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			this.logger.error(`library.json error: ${message}`);
		}

		return changed;
	}

	// Remove 'v' prefix if present (e.g., "v1.2.3" -> "1.2.3") and parse version numbers
	private parseTagVersion(tag: string): { major: number; minor: number; patch: number } {
		const normalizedTag = tag.replace(/^v/, '');
		const [major, minor, patch] = normalizedTag.split('.').map(Number);
		const tagVersion = { major, minor, patch: patch || 0 };

		return tagVersion;
	}

	private logCorrectedVersionInLibraryJson(folderPath: string, tag: string): void {
		const { major, minor, patch } = this.parseTagVersion(tag);
		const versionString = `${major}.${minor}.${patch}`;
		this.logger.info(`Corrected library.json version in "${folderPath}" to ${versionString} (from tag "${tag}").`);
	}

	private isPrependNodeOptionsRequired(library: string, tag: string): boolean {
		const prependNodeOptions = {
			'H5P.Dialogcards': ['1.8.8', '1.7.10'],
			'H5P.DragQuestion': ['1.15.4'],
			'H5P.DragText': ['1.10.25', '1.9.5', '1.8.20'],
			'H5P.InteractiveVideo': ['1.28.3'],
			'H5P.MultiMediaChoice': ['0.3.56', '0.2.1', '0.1.8'],
			'H5P.CoursePresentation': ['1.23.3'],
		};
		const prependNodeOptionsRequired = prependNodeOptions[library]?.includes(tag);

		return prependNodeOptionsRequired;
	}

	private prependNodeOptionsToRunScript(folderPath: string): void {
		const packageJsonPath = FileSystemHelper.getPackageJsonPath(folderPath);
		if (!FileSystemHelper.pathExists(packageJsonPath)) {
			return;
		}
		const packageJson = FileSystemHelper.readJsonFile(packageJsonPath) as { scripts?: { build?: string } };
		if (!packageJson.scripts || !packageJson.scripts.build) {
			return;
		}
		const buildScript = packageJson.scripts.build;
		const nodeOptionsPrefix = 'NODE_OPTIONS=--openssl-legacy-provider ';
		if (!buildScript.startsWith(nodeOptionsPrefix)) {
			packageJson.scripts.build = nodeOptionsPrefix + buildScript;
			FileSystemHelper.writeJsonFile(packageJsonPath, packageJson);
		}
	}

	private isShepherdLibrary(library: string): boolean {
		const shepherdLibraries = ['Shepherd'];
		const isShepherdLibrary = shepherdLibraries.includes(library);

		return isShepherdLibrary;
	}

	private areBuildStepsRequired(folderPath: string): boolean {
		const packageJsonPath = FileSystemHelper.getPackageJsonPath(folderPath);
		if (FileSystemHelper.pathExists(packageJsonPath)) {
			const packageJson = FileSystemHelper.readJsonFile(packageJsonPath) as { scripts?: { build?: string } };
			if (packageJson.scripts?.build) {
				this.logger.info('Running npm build...');

				return true;
			}
		}

		return false;
	}

	private isLegacyPeerDepsRequired(library: string, tag: string): boolean {
		const legacyPeerDeps = {
			'H5P.DragText': ['1.9.5', '1.8.20'],
		};
		const legacyPeerDepsRequired = legacyPeerDeps[library]?.includes(tag);

		return legacyPeerDepsRequired;
	}

	private isOldNodeVersionRequired(library: string, tag: string): string | undefined {
		const oldNodeVersions = {
			'H5P.AdventCalendar': {
				'0.2.5': '14',
			},
			'H5P.Agamotto': {
				'1.5.4': '14',
				'1.4.3': '14',
			},
			'H5P.CoursePresentation': {
				'1.22.11': '14',
				'1.21.7': '14',
				'1.20.4': '10',
				'1.19.3': '10',
				'1.18.1': '8',
				'1.17.10': '8',
			},
			'H5P.Crossword': {
				'0.4.9': '14',
				'v0.2.0': '14',
				'v0.1.10': '14',
			},
			'H5P.GameMap': {
				'1.1.1': '18',
				'1.0.6': '18',
			},
			'H5P.ImageJuxtaposition': {
				'1.4.1': '14',
			},
			'H5P.InteractiveBook': {
				'1.3.6': '14',
				'1.2.10': '14',
				'1.1.0': '10',
				'1.0.1': '10',
			},
			'H5P.KewArCode': {
				'v1.1.2': '18',
				'1.0.0': '14',
			},
			'H5P.Questionnaire': {
				'1.1.2': '14',
				'1.0.2': '14',
			},
			'H5P.SimpleMultiChoice': {
				'1.0.5': '14',
			},
			'H5P.SortParagraphs': {
				'0.10.7': '14',
			},
			'H5P.Tabs': {
				'1.0.4': '18',
			},
			'H5P.ThreeImage': {
				'0.5.8': '18',
				'0.4.11': '10',
				'0.3.11': '10',
				'0.2.13': '10',
			},
			'H5P.Transcript': {
				'1.1.1': '14',
				'1.0.0': '14',
			},
			'H5P.TranscriptLibrary': {
				'1.0.0': '14',
			},
			'H5PEditor.BranchingScenario': {
				'1.4.2': '18',
				'1.3.0': '14',
				'1.2.5': '14',
				'1.1.3': '10',
				'1.0.6': '10',
			},
			'H5PEditor.GameMap': {
				'1.0.1': '18',
			},
			'H5PEditor.QuestionSetTextualEditor': {
				'1.2.4': '14',
			},
			'H5PEditor.ThreeImage': {
				'0.4.7': '10',
				'0.3.3': '10',
				'0.2.0': '10',
			},
			'H5P.Dictation': {
				'v1.2.2': '18',
				'1.1.1': '14',
				'1.0.8': '14',
			},
		};

		const oldNodeVersion = oldNodeVersions[library]?.[tag];

		return oldNodeVersion;
	}

	private isInstallRequiredInsteadOfCi(library: string, tag: string): boolean {
		const installInsteadOfCi = {
			'H5P.CoursePresentation': ['1.18.1', '1.17.10'],
			'H5P.Questionnaire': ['1.1.2', '1.0.2'],
			'H5P.SimpleMultiChoice': ['1.0.5'],
			'H5P.Transcript': ['1.1.1', '1.0.0'],
		};
		const installRequired = installInsteadOfCi[library]?.includes(tag);

		return installRequired;
	}

	private executeBuildSteps(
		folderPath: string,
		legacyPeerDepsRequired: boolean = false,
		oldNodeVersion: string | undefined = undefined,
		installRequired: boolean = false
	): boolean {
		try {
			const nvmCommand = `source ~/.nvm/nvm.sh && nvm use ${oldNodeVersion}`;
			const isVerbose = this.logger.getLogLevel() >= LogLevel.VERBOSE;
			const stdio = isVerbose ? 'inherit' : 'pipe';

			let installCommand = 'npm';
			let installArgs = [installRequired ? 'install' : 'ci'];
			const installOptions: SpawnSyncOptions = { cwd: folderPath, stdio };
			if (legacyPeerDepsRequired) {
				installArgs.push('--legacy-peer-deps');
			}

			if (oldNodeVersion) {
				const bashCommand = `${nvmCommand} && npm ${installArgs.join(' ')}`;
				installCommand = 'bash';
				installArgs = ['-c', bashCommand];
				installOptions.env = {}; // Ensure a clean environment
			}

			const installResult = spawnSync(installCommand, installArgs, installOptions);
			if (installResult.status !== 0) {
				this.logger.error(`npm install/ci failed`);
				return false;
			}

			let buildCommand = 'npm';
			let buildArgs = ['run', 'build'];
			const buildOptions: SpawnSyncOptions = { cwd: folderPath, stdio };

			if (oldNodeVersion) {
				const bashCommand = `${nvmCommand} && npm ${buildArgs.join(' ')}`;
				buildCommand = 'bash';
				buildArgs = ['-c', bashCommand];
				buildOptions.env = {}; // Ensure a clean environment
			}

			const buildResult = spawnSync(buildCommand, buildArgs, buildOptions);
			if (buildResult.status !== 0) {
				this.logger.error(`npm run build failed`);
				return false;
			}

			return true;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			this.logger.error(`Build error: ${message}`);
			return false;
		}
	}

	private isLibraryPathCorrectionRequired(library: string, tag: string): boolean {
		const libraryPathCorrection = {
			'H5P.MemoryGame': ['1.3.36'],
		};
		const libraryPathCorrectionRequired = libraryPathCorrection[library]?.includes(tag);

		return libraryPathCorrectionRequired;
	}

	private checkAndCorrectLibraryJsonPaths(folderPath: string): boolean {
		const libraryJsonPath = FileSystemHelper.getLibraryJsonPath(folderPath);
		try {
			const json = FileSystemHelper.readLibraryJson(libraryJsonPath);
			const changed = this.filterInvalidPathsFromLibraryJson(json, folderPath);

			if (changed) {
				FileSystemHelper.writeJsonFile(libraryJsonPath, json);
			}

			return changed;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			this.logger.error(`Error correcting library.json paths: ${message}`);

			return false;
		}
	}

	private filterInvalidPathsFromLibraryJson(json: H5PLibrary, folderPath: string): boolean {
		const dependencyKeys = ['dynamicDependencies', 'preloadedDependencies', 'editorDependencies'];
		const assetKeys = ['preloadedJs', 'preloadedCss', 'editorJs', 'editorCss'];

		const dependenciesChanged = dependencyKeys.some((key) =>
			this.filterArrayByPathExistence(json, key, folderPath, true)
		);
		const assetsChanged = assetKeys.some((key) => this.filterArrayByPathExistence(json, key, folderPath, false));

		return dependenciesChanged || assetsChanged;
	}

	private filterArrayByPathExistence(
		json: H5PLibrary,
		key: string,
		folderPath: string,
		isDependency: boolean
	): boolean {
		const array = json[key];
		if (!Array.isArray(array)) {
			return false;
		}

		const filtered = array.filter((item) => this.isPathValid(item, folderPath, isDependency));
		if (filtered.length === array.length) {
			return false;
		}

		json[key] = filtered;

		return true;
	}

	private isPathValid(item: unknown, folderPath: string, isDependency: boolean): boolean {
		if (isDependency && !this.inputIsObjectWithPath(item)) {
			return true;
		}

		const itemWithPath = item as { path: string };
		const fullPath = FileSystemHelper.buildPath(folderPath, itemWithPath.path);

		return FileSystemHelper.pathExists(fullPath);
	}

	private inputIsObjectWithPath(obj: unknown): obj is { path: string } {
		return (
			typeof obj === 'object' && obj !== null && 'path' in obj && typeof (obj as { path: string }).path === 'string'
		);
	}

	private cleanUpUnwantedFilesInLibraryFolder(folderPath: string): void {
		const ignoreFilePath = FileSystemHelper.buildPath(folderPath, '.h5pignore');
		if (!FileSystemHelper.pathExists(ignoreFilePath)) {
			return;
		}
		const ignoreContent = FileSystemHelper.readFileAsString(ignoreFilePath);
		const ignoreFiles = ignoreContent
			.split(/\r?\n/)
			.map((line) => line.trim())
			.filter((line) => line && !line.startsWith('#'));
		for (const relPath of ignoreFiles) {
			const absPath = FileSystemHelper.buildPath(folderPath, relPath);
			if (FileSystemHelper.pathExists(absPath)) {
				try {
					const stat = FileSystemHelper.getStatsOfPath(absPath);
					if (stat.isDirectory()) {
						FileSystemHelper.removeFolder(absPath);
					} else {
						FileSystemHelper.removeFile(absPath);
					}
				} catch (err) {
					const message = err instanceof Error ? err.message : 'Unknown error';
					this.logger.error(`Failed to remove ignored file ${absPath}: ${message}`);
				}
			}
		}
	}

	private getDependenciesFromLibraryJson(repoName: string, tag: string): ILibraryName[] {
		const { folderPath } = FileSystemHelper.createTempFolder(this.tempFolderPath, repoName, tag);
		const libraryJsonPath = FileSystemHelper.getLibraryJsonPath(folderPath);
		const libraryJsonContent = FileSystemHelper.readLibraryJson(libraryJsonPath);
		const dependencies = (libraryJsonContent?.preloadedDependencies ?? []).concat(
			libraryJsonContent?.editorDependencies ?? [],
			libraryJsonContent?.dynamicDependencies ?? []
		);

		return dependencies;
	}

	private getSoftDependenciesFromSemantics(repoName: string, tag: string): ILibraryName[] {
		const softDependencies: ILibraryName[] = [];

		const { folderPath } = FileSystemHelper.createTempFolder(this.tempFolderPath, repoName, tag);
		const semanticsJsonPath = FileSystemHelper.getSemanticsJsonPath(folderPath);
		const semanticsFileExists = FileSystemHelper.pathExists(semanticsJsonPath);
		if (semanticsFileExists) {
			const semantics = FileSystemHelper.readSemanticsJson(semanticsJsonPath);
			if (Array.isArray(semantics)) {
				const libraryOptions = this.findLibraryOptions(semantics);
				for (const libraryOption of libraryOptions) {
					const libraryName = LibraryName.fromUberName(libraryOption, { useWhitespace: true, useHyphen: false });
					softDependencies.push(libraryName);
				}
			}
		}

		return softDependencies;
	}

	private findLibraryOptions(semantics: H5PSemanticField[]): string[] {
		const libraryOptions = semantics.flatMap((field) => this.extractLibraryOptionsFromNode(field));

		return libraryOptions;
	}

	private extractLibraryOptionsFromNode(node: unknown): string[] {
		if (!node || typeof node !== 'object') {
			return [];
		}

		const ownOptions = this.isLibraryField(node) ? node.options : [];
		const childOptions = Object.values(node).flatMap((value) => this.extractLibraryOptionsFromValue(value));
		const libraryOptions = [...ownOptions, ...childOptions];

		return libraryOptions;
	}

	private extractLibraryOptionsFromValue(value: unknown): string[] {
		if (Array.isArray(value)) {
			const libraryOptions = value.flatMap((item) => this.extractLibraryOptionsFromNode(item));

			return libraryOptions;
		}
		if (typeof value === 'object' && value !== null) {
			const libraryOptions = this.extractLibraryOptionsFromNode(value);

			return libraryOptions;
		}

		return [];
	}

	private isLibraryField(obj: object): obj is H5PSemanticField & { type: 'library'; options: string[] } {
		const isLibraryField =
			'type' in obj &&
			obj.type === 'library' &&
			'options' in obj &&
			Array.isArray(obj.options) &&
			obj.options.every((opt) => typeof opt === 'string');

		return isLibraryField;
	}

	private async buildLibraryDependency(dependency: ILibraryName): Promise<void> {
		const depName = dependency.machineName;
		const depMajor = dependency.majorVersion;
		const depMinor = dependency.minorVersion;
		const depUberName = LibraryName.toUberName(dependency);

		const depRepoName = this.gitHubClient.mapMachineNameToGitHubRepo(depName);

		if (!depRepoName) {
			this.logger.failure(`${depUberName}.x - no GitHub repo`);
			this.failedLibraries.add(`${depName}-${depMajor}.${depMinor}.x`);

			return;
		}

		const tags = await this.gitHubClient.fetchAllTags(depRepoName);
		let depTag = this.getHighestVersionTags(tags, depMajor, depMinor);
		let useMasterBranch = false;

		if (!depTag) {
			const masterVersion = await this.checkMasterBranchVersion(depRepoName, depMajor, depMinor);
			if (masterVersion) {
				depTag = masterVersion;
				useMasterBranch = true;
			}
		}

		if (!depTag) {
			this.logger.failure(`${depUberName}.x - no matching tag`);
			this.failedLibraries.add(`${depName}-${depMajor}.${depMinor}.x`);

			return;
		}

		try {
			const currentH5pHubTag = await this.h5pHubClient.getCurrentVersion(depName);
			const depPatch = Number(depTag.split('.')[2]);
			if (
				depMajor === currentH5pHubTag.majorVersion &&
				depMinor === currentH5pHubTag.minorVersion &&
				depPatch > currentH5pHubTag.patchVersion
			) {
				const cappedTag = this.findTagByVersion(tags, depMajor, depMinor, currentH5pHubTag.patchVersion);
				if (cappedTag) {
					depTag = cappedTag;
				}
			}
		} catch {
			// Using latest available tag if Hub version unavailable
		}

		// special handling for "FontAwesome" as version 4.5.6 seems to be broken
		// so we force 4.5.4 which is known to work
		if (depName === 'FontAwesome' && depMajor === 4 && depMinor === 5) {
			depTag = '4.5.4';
		}

		const depVersion = `${depName}-${depTag}`;

		// Early availability check to avoid unnecessary work
		if (this.availableVersions.includes(depVersion)) {
			this.logger.skip(`${depVersion} (already available)`);
			this.skippedLibraries.add(depVersion);

			return;
		}

		if (this.isAlreadyFailed(depName, depTag)) {
			return;
		}

		// Recursively build this dependency
		await this.buildLibraryVersionAndDependencies(depName, depTag, depRepoName, useMasterBranch);
	}

	private getHighestVersionTags(tags: string[], majorVersion: number, minorVersion: number): string | undefined {
		const matchingTags = tags.filter((t) => {
			const { major: tagMajor, minor: tagMinor } = this.parseTagVersion(t);

			return tagMajor === majorVersion && tagMinor === minorVersion;
		});
		let highestVersionTag;
		if (matchingTags.length > 0) {
			highestVersionTag = matchingTags.reduce((a, b) => {
				const { patch: patchA } = this.parseTagVersion(a);
				const { patch: patchB } = this.parseTagVersion(b);
				return patchA > patchB ? a : b;
			});
		}

		return highestVersionTag;
	}

	private findTagByVersion(tags: string[], major: number, minor: number, patch: number): string | undefined {
		return tags.find((t) => {
			const parsed = this.parseTagVersion(t);

			return parsed.major === major && parsed.minor === minor && parsed.patch === patch;
		});
	}

	private async checkMasterBranchVersion(
		repoName: string,
		requiredMajor: number,
		requiredMinor: number
	): Promise<string | undefined> {
		const libraryJson = await this.gitHubClient.fetchLibraryJsonFromBranch(repoName, 'master');

		if (!libraryJson) {
			return undefined;
		}

		if (libraryJson.majorVersion === requiredMajor && libraryJson.minorVersion === requiredMinor) {
			const version = `${libraryJson.majorVersion}.${libraryJson.minorVersion}.${libraryJson.patchVersion}`;
			this.logger.debug(`Found matching version ${version} on master branch of ${repoName}`);

			return version;
		}

		return undefined;
	}

	private isCurrentVersionAvailable(library: string, tag: string): boolean {
		return this.availableVersions.includes(`${library}-${tag}`);
	}

	private isNewerPatchVersionAvailable(library: string, tag: string): boolean {
		const { major: tagMajor, minor: tagMinor, patch: tagPatch } = this.parseTagVersion(tag);
		const newerPatchVersionAvailable = this.availableVersions.some((v) => {
			const [lib, version] = v.split('-');
			if (lib !== library) return false;
			const { major: versionMajor, minor: versionMinor, patch: versionPatch } = this.parseTagVersion(version);
			const result = versionMajor === tagMajor && versionMinor === tagMinor && versionPatch >= tagPatch;
			return result;
		});

		return newerPatchVersionAvailable;
	}

	private isAlreadyFailed(library: string, tag: string): boolean {
		// Check exact version match
		if (this.failedLibraries.has(`${library}-${tag}`)) {
			this.logger.skip(`${library}-${tag} (previously failed)`);
			return true;
		}

		// Check wildcard match (e.g., "H5P.Foo-1.2.x" for failures without specific patch version)
		const { major, minor } = this.parseTagVersion(tag);
		if (this.failedLibraries.has(`${library}-${major}.${minor}.x`)) {
			this.logger.skip(`${library}-${tag} (previously failed)`);
			return true;
		}

		return false;
	}
}
