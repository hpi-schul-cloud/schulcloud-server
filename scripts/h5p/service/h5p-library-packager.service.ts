import { ILibraryName, LibraryName } from '@lumieducation/h5p-server';
import { IFullLibraryName } from '@lumieducation/h5p-server/build/src/types';
import { spawnSync, SpawnSyncOptions } from 'child_process';
import { FileSystemHelper } from '../helper/file-system.helper';
import { H5PLibrary } from '../interface/h5p-library';
import { GitHubClientOptions, H5pGitHubClient } from './h5p-github.client';
import { H5pHubClient } from './h5p-hub.client';

type LibraryRepoMap = Record<string, string>;

type InstallResults = { installedLibraries: Set<string>; failedLibraries: Set<string> };

export class H5pLibraryPackagerService {
	libraryRepoMap: LibraryRepoMap;
	tempFolderPath: string;
	gitHubClient: H5pGitHubClient;
	h5pHubClient: H5pHubClient;

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

		this.libraryRepoMap = libraryRepoMap;
		this.gitHubClient = new H5pGitHubClient();
		this.h5pHubClient = new H5pHubClient();
	}

	public async buildH5pLibrariesFromGitHubAsBulk(libraries: string[]): Promise<void> {
		const result: InstallResults = { installedLibraries: new Set<string>(), failedLibraries: new Set<string>() };
		const availableVersions: string[] = [];
		for (const library of libraries) {
			this.logLibraryBanner(library);
			const libraryResult = await this.buildLibrary(library, availableVersions);

			console.log(`### Finished building of ${library}.`);
			console.log(`### Successfully built libraries: ${this.formatLibraryList(libraryResult.installedLibraries)}`);
			console.log(`### Failed to build libraries: ${this.formatLibraryList(libraryResult.failedLibraries)}`);

			libraryResult.installedLibraries.forEach((lib) => result.installedLibraries.add(lib));
			libraryResult.failedLibraries.forEach((lib) => result.failedLibraries.add(lib));
		}

		console.log('>>> Installation Summary:');
		console.log(`>>> Successfully installed libraries: ${this.formatLibraryList(result.installedLibraries)}`);
		console.log(`>>> Failed to install libraries: ${this.formatLibraryList(result.failedLibraries)}`);
	}

	private formatLibraryList(libraries: Set<string>): string {
		return Array.from(libraries)
			.sort((a, b) => a.localeCompare(b))
			.join(', ');
	}

	private logLibraryBanner(libraryName: string): void {
		const name = `*   ${libraryName}   *`;
		const border = '*'.repeat(name.length);
		console.log(border);
		console.log(name);
		console.log(border);
	}

	private async buildLibrary(library: string, availableVersions: string[]): Promise<InstallResults> {
		const result: InstallResults = { installedLibraries: new Set<string>(), failedLibraries: new Set<string>() };
		const repoName = this.mapMachineNameToGitHubRepo(library);
		if (!repoName) {
			console.log(`No GitHub repository found for ${library}.`);

			return result;
		}
		const options: GitHubClientOptions = { maxRetries: 3 };
		const tags = await this.gitHubClient.fetchAllTags(repoName, options);
		let filteredTags = this.getHighestPatchTags(tags);

		const currentH5pHubTag = await this.getCurrentTagFromH5pHub(library);
		if (currentH5pHubTag) {
			filteredTags = this.filterTagsByH5pHubVersion(filteredTags, currentH5pHubTag);
			console.log(`Filtered tags to exclude versions >= ${this.formatLibraryVersion(currentH5pHubTag)}`);
		}

		console.log(`Found ${filteredTags.length} versions of ${library} in ${repoName}: ${filteredTags.join(', ')}`);
		for (const tag of filteredTags) {
			const tagResult = await this.buildLibraryVersionAndDependencies(library, tag, repoName, availableVersions);

			tagResult.installedLibraries.forEach((lib) => result.installedLibraries.add(lib));
			tagResult.failedLibraries.forEach((lib) => result.failedLibraries.add(lib));
		}

		return result;
	}

	// TODO: move this to H5pGitHubClient?

	private mapMachineNameToGitHubRepo(library: string): string | undefined {
		const repo = this.libraryRepoMap[library];
		return repo;
	}

	private async getCurrentTagFromH5pHub(library: string): Promise<IFullLibraryName | undefined> {
		const tempDir = FileSystemHelper.getTempDir();
		const h5pHubFolder = FileSystemHelper.buildPath(tempDir, 'h5p-hub');
		if (!FileSystemHelper.pathExists(h5pHubFolder)) {
			console.log(`Creating H5P Hub folder at ${h5pHubFolder}.`);
			FileSystemHelper.createFolder(h5pHubFolder);
		}

		const filePath = FileSystemHelper.buildPath(h5pHubFolder, `${library}.h5p`);
		if (FileSystemHelper.pathExists(filePath)) {
			console.log(`Removing existing H5P Hub file at ${filePath}.`);
			FileSystemHelper.removeFile(filePath);
		}

		console.log(`Downloading current version of ${library} from H5P Hub to ${filePath}.`);
		await this.h5pHubClient.downloadContentType(library, filePath);

		console.log(`Unzipping H5P Hub file ${filePath} to ${h5pHubFolder}.`);
		const outputDir = FileSystemHelper.buildPath(h5pHubFolder, library);
		FileSystemHelper.unzipFile(filePath, outputDir);

		const folders = FileSystemHelper.getAllFolders(outputDir);
		const folder = folders.find((folder) => folder.startsWith(library));
		if (!folder) {
			console.warn(`No folder found for library ${library} in unzipped H5P Hub content.`);
			return;
		}

		const libraryFolder = FileSystemHelper.buildPath(outputDir, folder);
		const libraryJsonPath = FileSystemHelper.getLibraryJsonPath(libraryFolder);
		const json = FileSystemHelper.readJsonFile(libraryJsonPath) as {
			majorVersion: number;
			minorVersion: number;
			patchVersion: number;
			[key: string]: any;
		};
		const tag: IFullLibraryName = {
			machineName: library,
			majorVersion: json.majorVersion,
			minorVersion: json.minorVersion,
			patchVersion: json.patchVersion,
		};

		console.log('Found current version of library from H5P Hub:', this.formatLibraryVersion(tag));

		return tag;
	}

	private formatLibraryVersion(version: IFullLibraryName): string {
		if (!version) return '';

		return `${version.machineName}-${version.majorVersion}.${version.minorVersion}.${version.patchVersion}`;
	}

	private filterTagsByH5pHubVersion(tags: string[], currentH5pHubTag: IFullLibraryName): string[] {
		return tags.filter((tag) => {
			const [major, minor, patch] = tag.split('.').map(Number);

			// Compare versions: return true if tag is LESS than currentH5pHubTag
			if (major < currentH5pHubTag.majorVersion) return true;
			if (major > currentH5pHubTag.majorVersion) return false;

			if (minor < currentH5pHubTag.minorVersion) return true;
			if (minor > currentH5pHubTag.minorVersion) return false;

			if (patch < currentH5pHubTag.patchVersion) return true;

			// If versions are equal or tag is greater, exclude it
			return false;
		});
	}

	private getHighestPatchTags(tags: string[]): string[] {
		const semverRegex = /^v?(\d+)\.(\d+)\.(\d+)$/;
		const versionMap = new Map<string, { tag: string; patch: number }>();
		for (const tag of tags) {
			const match = tag.match(semverRegex);
			if (!match) continue;
			const [, major, minor, patch] = match;
			const key = `${major}.${minor}`;
			const patchNum = parseInt(patch, 10);
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
		availableVersions: string[]
	): Promise<InstallResults> {
		this.logStartBuildingOfLibraryFromGitHub(library, tag);
		const result: InstallResults = {
			installedLibraries: new Set<string>(),
			failedLibraries: new Set<string>(),
		};

		if (this.isCurrentVersionAvailable(library, tag, availableVersions)) return result;
		if (this.isNewerPatchVersionAvailable(library, tag, availableVersions)) return result;

		const validLibrary = await this.buildLibraryTagFromGitHub(library, tag, repoName);
		if (validLibrary) {
			result.installedLibraries.add(`${library}-${tag}`);
			this.logBuildingOfLibraryFromGitHubSuccessful(library, tag);
		} else {
			result.failedLibraries.add(`${library}-${tag}`);
			this.logBuildingOfLibraryFromGitHubFailed(library, tag);

			return result;
		}
		availableVersions.push(`${library}-${tag}`);

		this.logStartBuildingOfDependenciesFromGitHub(library, tag);

		let dependencies = this.getDependenciesFromLibraryJson(library, tag);
		const softDependencies = this.getSoftDependenciesFromSemantics(library, tag);
		dependencies = dependencies.concat(softDependencies);
		if (dependencies.length === 0) {
			this.logNoDependenciesFoundForLibrary(library, tag);

			return result;
		}

		for (const dependency of dependencies) {
			const depResults = await this.buildLibraryDependency(dependency, library, tag, availableVersions);
			depResults.installedLibraries.forEach((lib) => result.installedLibraries.add(lib));
			depResults.failedLibraries.forEach((lib) => result.failedLibraries.add(lib));
		}
		this.logFinishedBuildingOfLibraryFromGitHub(library, tag);

		return result;
	}

	private logStartBuildingOfLibraryFromGitHub(library: string, tag: string): void {
		console.log(`Start building of ${library}-${tag} from GitHub.`);
	}

	private logBuildingOfLibraryFromGitHubSuccessful(library: string, tag: string): void {
		console.log(`Successfully built ${library}-${tag} from GitHub.`);
	}

	private logBuildingOfLibraryFromGitHubFailed(library: string, tag: string): void {
		console.log(`Failed to build ${library}-${tag} from GitHub.`);
	}

	private logNoDependenciesFoundForLibrary(library: string, tag: string): void {
		console.log(`No dependencies found for ${library}-${tag}.`);
	}

	private logStartBuildingOfDependenciesFromGitHub(library: string, tag: string): void {
		console.log(`Start building of dependencies for ${library}-${tag} from GitHub.`);
	}

	private logFinishedBuildingOfLibraryFromGitHub(library: string, tag: string): void {
		console.log(`Finished building of ${library}-${tag} from GitHub.`);
	}

	private async buildLibraryTagFromGitHub(library: string, tag: string, repo: string): Promise<boolean> {
		// TODO: wenn wir filePath vorher erstellen könnten würde der tempFolder hinter dem unzipFile verschwinden welches folderPath zurück gibt.
		// removeTemporaryFiles sollte dann auch nur folderPath als input brauchen.
		// Dann wäre es möglich ein pre and post hook zu erstellen.
		// Wenn man dann noch FileSystemHelper als Klasse instanziiert über ein factory könnte man dort noch mehr implizites Wissen weg kapseln.
		const { filePath, folderPath, tempFolder } = FileSystemHelper.createTempFolder(this.tempFolderPath, library, tag);
		await this.gitHubClient.downloadTag(repo, tag, filePath);

		if (FileSystemHelper.pathExists(folderPath)) {
			FileSystemHelper.removeFolder(folderPath);
		}
		FileSystemHelper.unzipAndRenameFolder(filePath, folderPath, tempFolder, repo, tag);
		FileSystemHelper.removeFile(filePath);

		// TODO: gefühlt gehört das in den try catch rein, es sind dafür aber viel zu viele try catch instanzen.
		// Genauso wie die downloadGitHubTag
		// Wenn das umgesetzt wäre könnte das return result in das try catch rein
		this.executeAdditionalBuildStepsIfRequired(folderPath, library, tag);

		this.cleanUpUnwantedFilesinLibraryFolder(folderPath);

		// TODO: Should this be kept as it would make H5P CLI required!?
		const validated = this.validateH5pLibrary(folderPath);

		return validated;
	}

	private executeAdditionalBuildStepsIfRequired(folderPath: string, library: string, tag: string): void {
		this.checkAndCorrectLibraryJsonVersion(folderPath, tag);

		if (this.isPrependNodeOptionsRequired(library, tag)) {
			this.prependNodeOptionsToRunScript(folderPath);
		}

		if (!this.isShepherdLibrary(library) && this.areBuildStepsRequired(folderPath)) {
			const legacyPeerDepsRequired = this.isLegacyPeerDepsRequired(library, tag);
			const oldNodeVersion = this.isOldNodeVersionRequired(library, tag);
			const installRequired = this.isInstallRequiredInsteadOfCi(library, tag);
			this.executeBuildSteps(folderPath, library, legacyPeerDepsRequired, oldNodeVersion, installRequired);
		}

		if (this.isLibraryPathCorrectionRequired(library, tag)) {
			this.checkAndCorrectLibraryJsonPaths(folderPath);
		}
	}

	private checkAndCorrectLibraryJsonVersion(folderPath: string, tag: string): boolean {
		const libraryJsonPath = FileSystemHelper.getLibraryJsonPath(folderPath);
		let changed = false;
		try {
			const json = FileSystemHelper.readJsonFile(libraryJsonPath) as {
				majorVersion: number;
				minorVersion: number;
				patchVersion: number;
				[key: string]: any;
			};
			const [tagMajor, tagMinor, tagPatch] = tag.split('.').map(Number);
			if (json.majorVersion !== tagMajor || json.minorVersion !== tagMinor || json.patchVersion !== tagPatch) {
				json.majorVersion = tagMajor;
				json.minorVersion = tagMinor;
				json.patchVersion = tagPatch;
				FileSystemHelper.writeJsonFile(libraryJsonPath, json);
				changed = true;
				this.logCorrectedVersionInLibraryJson(folderPath, tag);
			}
		} catch (error) {
			console.error(`Error reading or correcting library.json in ${folderPath}:`, error);
		}

		return changed;
	}

	private logCorrectedVersionInLibraryJson(folderPath: string, tag: string): void {
		console.log(`Corrected version in library.json to match tag ${tag} in ${folderPath}.`);
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
			console.warn(`package.json not found in ${folderPath}`);
			return;
		}
		const packageJson = FileSystemHelper.readJsonFile(packageJsonPath) as { scripts?: { build?: string } };
		if (!packageJson.scripts || !packageJson.scripts.build) {
			console.warn(`No 'build' script found in package.json at ${folderPath}`);
			return;
		}
		const buildScript = packageJson.scripts.build;
		const nodeOptionsPrefix = 'NODE_OPTIONS=--openssl-legacy-provider ';
		if (!buildScript.startsWith(nodeOptionsPrefix)) {
			packageJson.scripts.build = nodeOptionsPrefix + buildScript;
			FileSystemHelper.writeJsonFile(packageJsonPath, packageJson);
			console.log(`Prepended NODE_OPTIONS to 'build' script in ${packageJsonPath}`);
		} else {
			console.log(`'build' script in ${packageJsonPath} already contains NODE_OPTIONS prefix.`);
		}
	}

	private isShepherdLibrary(library: string): boolean {
		const shepherdLibraries = ['Shepherd'];
		const isShepherdLibrary = shepherdLibraries.includes(library);

		return isShepherdLibrary;
	}

	private areBuildStepsRequired(folderPath: string): boolean {
		let buildStepsRequired = false;
		const packageJsonPath = FileSystemHelper.getPackageJsonPath(folderPath);
		if (FileSystemHelper.pathExists(packageJsonPath)) {
			const packageJson = FileSystemHelper.readJsonFile(packageJsonPath) as { scripts?: { build?: string } };
			if (!packageJson.scripts || !packageJson.scripts.build) {
				this.logNoBuildScriptInPackageJson(folderPath);
			} else {
				this.logBuildScriptFoundInPackageJson(folderPath);
				buildStepsRequired = true;
			}
		}

		return buildStepsRequired;
	}

	private logNoBuildScriptInPackageJson(folderPath: string): void {
		console.log(`No 'build' script found in package.json at ${folderPath}.`);
	}

	private logBuildScriptFoundInPackageJson(folderPath: string): void {
		console.log(`Found 'build' script in package.json at ${folderPath}.`);
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
			'H5P.CoursePresentation': {
				'1.22.11': '14',
				'1.21.7': '14',
				'1.20.4': '10',
				'1.19.3': '10',
				'1.18.1': '8',
				'1.17.10': '8',
			},
			'H5P.Questionnaire': {
				'1.1.2': '14',
				'1.0.2': '14',
			},
			'H5P.SimpleMultiChoice': {
				'1.0.5': '14',
			},
			'H5PEditor.QuestionSetTextualEditor': {
				'1.2.4': '14',
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
		};
		const installRequired = installInsteadOfCi[library]?.includes(tag);

		return installRequired;
	}

	private executeBuildSteps(
		folderPath: string,
		library: string,
		legacyPeerDepsRequired: boolean = false,
		oldNodeVersion: string | undefined = undefined,
		installRequired: boolean = false
	): void {
		try {
			this.logRunningNpmCiAndBuild(folderPath);

			const nvmCommand = `source ~/.nvm/nvm.sh && nvm use ${oldNodeVersion}`;

			let installCommand = 'npm';
			let installArgs = [installRequired ? 'install' : 'ci'];
			const installOptions: SpawnSyncOptions = { cwd: folderPath, stdio: 'inherit' };
			if (legacyPeerDepsRequired) {
				installArgs.push('--legacy-peer-deps');
			}

			if (oldNodeVersion) {
				const bashCommand = `${nvmCommand} && npm ${installArgs.join(' ')}`;
				installCommand = 'bash';
				installArgs = ['-c', bashCommand];
				installOptions.env = {}; // Ensure a clean environment
			}

			console.log('Execute install command:', installCommand, installArgs, installOptions);
			const installResult = spawnSync(installCommand, installArgs, installOptions);
			if (installResult.status !== 0) {
				throw new Error('npm install/ci failed');
			}

			let buildCommand = 'npm';
			let buildArgs = ['run', 'build'];
			const buildOptions: SpawnSyncOptions = { cwd: folderPath, stdio: 'inherit' };

			if (oldNodeVersion) {
				const bashCommand = `${nvmCommand} && npm ${buildArgs.join(' ')}`;
				buildCommand = 'bash';
				buildArgs = ['-c', bashCommand];
				buildOptions.env = {}; // Ensure a clean environment
			}

			console.log('Execute build command:', buildCommand, buildArgs, buildOptions);
			const buildResult = spawnSync(buildCommand, buildArgs, buildOptions);
			if (buildResult.status !== 0) {
				throw new Error('npm run build failed');
			}
		} catch (error) {
			console.error(`Unknown error while trying to build library ${library} in ${folderPath}:`, error);
		}
	}

	private logRunningNpmCiAndBuild(folderPath: string): void {
		console.log(`Running npm ci and npm run build in ${folderPath}.`);
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
		let changed = false;
		try {
			const json = FileSystemHelper.readJsonFile(libraryJsonPath) as H5PLibrary;

			// List of keys in library.json that may contain file paths
			const filePathKeys = [
				'preloadedJs',
				'preloadedCss',
				'editorJs',
				'editorCss',
				'dynamicDependencies',
				'preloadedDependencies',
				'editorDependencies',
			];

			for (const key of filePathKeys) {
				if (Array.isArray(json[key])) {
					// For dependencies, check for 'path' property
					if (key.endsWith('Dependencies')) {
						const filteredDeps = json[key].filter((dep) => {
							if (this.inputIsObjectWithPath(dep)) {
								const depPath = FileSystemHelper.buildPath(folderPath, dep.path);
								return FileSystemHelper.pathExists(depPath);
							}
							return true;
						});
						if (filteredDeps.length !== json[key].length) {
							json[key] = filteredDeps;
							changed = true;
						}
					} else {
						// For JS/CSS arrays, check each file path
						const filteredFiles = json[key].filter((file) => {
							const filePath = FileSystemHelper.buildPath(folderPath, file.path);
							return FileSystemHelper.pathExists(filePath);
						});
						if (filteredFiles.length !== json[key].length) {
							json[key] = filteredFiles;
							changed = true;
						}
					}
				}
			}

			if (changed) {
				FileSystemHelper.writeJsonFile(libraryJsonPath, json);
				this.logCorrectedFilePathsInLibraryJson(folderPath);
			}
		} catch (error) {
			console.error(`Unknown error while reading or correcting library.json file paths in ${folderPath}:`, error);
		}
		return changed;
	}

	private inputIsObjectWithPath(obj: any): boolean {
		return typeof obj === 'object' && obj !== null && 'path' in obj && typeof obj.path === 'string';
	}

	private validateH5pLibrary(folderPath: string): boolean {
		try {
			const validateCommand = 'h5p';
			const validateArgs = ['validate', folderPath];
			const validateOptions: SpawnSyncOptions = { cwd: folderPath, stdio: 'inherit', shell: true };

			const result = spawnSync(validateCommand, validateArgs, validateOptions);
			if (result.status === 0) {
				console.log(`'h5p validate' succeeded for ${folderPath}`);
				return true;
			} else {
				console.error(`'h5p validate' failed for ${folderPath}`);
				return false;
			}
		} catch (error) {
			console.error(`Error running 'h5p validate' for ${folderPath}:`, error);
			return false;
		}
	}

	private logCorrectedFilePathsInLibraryJson(folderPath: string): void {
		console.log(`Corrected file paths in library.json to only contain available files in ${folderPath}.`);
	}

	private cleanUpUnwantedFilesinLibraryFolder(folderPath: string): void {
		const ignoreFilePath = FileSystemHelper.buildPath(folderPath, '.h5pignore');
		if (!FileSystemHelper.pathExists(ignoreFilePath)) {
			return;
		}
		const ignoreContent = FileSystemHelper.readFile(ignoreFilePath);
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
						console.log(`Removed directory from .h5pignore: ${absPath}`);
					} else {
						FileSystemHelper.removeFile(absPath);
						console.log(`Removed file from .h5pignore: ${absPath}`);
					}
				} catch (err) {
					console.error(`Failed to remove ignored file or directory: ${absPath}`, err);
				}
			}
		}
	}

	private getDependenciesFromLibraryJson(repoName: string, tag: string): ILibraryName[] {
		const { folderPath } = FileSystemHelper.createTempFolder(this.tempFolderPath, repoName, tag);
		const libraryJsonPath = FileSystemHelper.getLibraryJsonPath(folderPath);
		const libraryJsonContent = FileSystemHelper.readJsonFile(libraryJsonPath) as {
			preloadedDependencies?: ILibraryName[];
			editorDependencies?: ILibraryName[];
			dynamicDependencies?: ILibraryName[];
		};
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
			const semantics = FileSystemHelper.readJsonFile(semanticsJsonPath);
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

	private findLibraryOptions(semantics: unknown[]): string[] {
		const results: string[] = [];

		function search(obj: unknown): void {
			if (obj && typeof obj === 'object') {
				if ('type' in obj && obj.type && obj.type === 'library' && 'options' in obj && Array.isArray(obj.options)) {
					results.push(...obj.options);
				}
				for (const key in obj) {
					const value = obj[key];
					if (Array.isArray(value)) {
						value.forEach(search);
					} else if (typeof value === 'object' && value !== null) {
						search(value);
					} else {
						// Primitive value, do nothing
					}
				}
			}
		}

		semantics.forEach(search);

		return results;
	}

	private async buildLibraryDependency(
		dependency: ILibraryName,
		library: string,
		tag: string,
		availableVersions: string[]
	): Promise<InstallResults> {
		const result: InstallResults = { installedLibraries: new Set<string>(), failedLibraries: new Set<string>() };

		const depName = dependency.machineName;
		const depMajor = dependency.majorVersion;
		const depMinor = dependency.minorVersion;
		this.logBuildingLibraryDependency(dependency, library, tag);

		const depRepoName = this.mapMachineNameToGitHubRepo(depName);

		if (!depRepoName) {
			this.logGithubRepositoryNotFound(dependency.machineName);
			result.failedLibraries.add(dependency.machineName);

			return result;
		}

		const options: GitHubClientOptions = { maxRetries: 3 };
		const tags = await this.gitHubClient.fetchAllTags(depRepoName, options);
		const depTag = this.getHighestVersionTags(tags, depMajor, depMinor);
		if (!depTag) {
			this.logTagNotFound(dependency);
			result.failedLibraries.add(dependency.machineName);

			return result;
		}

		const dependencyResult = await this.buildLibraryVersionAndDependencies(
			depName,
			depTag,
			depRepoName,
			availableVersions
		);
		if (dependencyResult.failedLibraries.size === 0) {
			this.logBuildingLibraryDependencySuccess(depName, depTag);
		} else {
			this.logBuildingLibraryDependencyFailed(depName, depTag);
		}
		dependencyResult.installedLibraries.forEach((lib) => result.installedLibraries.add(lib));
		dependencyResult.failedLibraries.forEach((lib) => result.failedLibraries.add(lib));

		return result;
	}

	private logBuildingLibraryDependency(dependency: ILibraryName, library: string, tag: string): void {
		console.log(`Building dependency ${LibraryName.toUberName(dependency)}.x from GitHub for ${library}-${tag}.`);
	}

	private logGithubRepositoryNotFound(library: string): void {
		console.log(`No GitHub repository found for ${library}.`);
	}

	private logTagNotFound(dependency: ILibraryName): void {
		console.log(`No suitable tag found for dependency ${LibraryName.toUberName(dependency)}.x .`);
	}

	private logBuildingLibraryDependencySuccess(depName: string, depTag: string): void {
		console.log(`Successfully built dependency ${depName}-${depTag} from GitHub.`);
	}

	private logBuildingLibraryDependencyFailed(depName: string, depTag: string): void {
		console.log(`Failed to build dependency ${depName}-${depTag} from GitHub.`);
	}

	private getHighestVersionTags(tags: string[], majorVersion: number, minorVersion: number): string | undefined {
		const matchingTags = tags.filter((t) => {
			const [maj, min] = t.split('.').map(Number);

			return maj === majorVersion && min === minorVersion;
		});
		let highestVersionTag;
		if (matchingTags.length > 0) {
			highestVersionTag = matchingTags.reduce((a, b) => {
				const patchA = Number(a.split('.')[2]);
				const patchB = Number(b.split('.')[2]);
				return patchA > patchB ? a : b;
			});
		}

		return highestVersionTag;
	}

	private isCurrentVersionAvailable(library: string, tag: string, availableVersions: string[]): boolean {
		const currentPatchVersionAvailable = availableVersions.includes(`${library}-${tag}`);

		if (currentPatchVersionAvailable) {
			this.logVersionAlreadyAvailable(library, tag);
		}

		return currentPatchVersionAvailable;
	}

	private logVersionAlreadyAvailable(library: string, tag: string): void {
		console.log(`${library}-${tag} is already available.`);
	}

	private isNewerPatchVersionAvailable(library: string, tag: string, availableVersions: string[]): boolean {
		const [tagMajor, tagMinor, tagPatch] = tag.split('.').map(Number);
		const newerPatchVersionAvailable = availableVersions.some((v) => {
			const [lib, version] = v.split('-');
			if (lib !== library) return false;
			const [major, minor, patch] = version.split('.').map(Number);
			const result = major === tagMajor && minor === tagMinor && patch >= tagPatch;
			return result;
		});

		if (newerPatchVersionAvailable) {
			this.logNewerPatchVersionAlreadyAvailable(library, tag);
		}

		return newerPatchVersionAvailable;
	}

	private logNewerPatchVersionAlreadyAvailable(library: string, tag: string): void {
		console.log(`A newer patch version of ${library}-${tag} is already available.`);
	}
}
