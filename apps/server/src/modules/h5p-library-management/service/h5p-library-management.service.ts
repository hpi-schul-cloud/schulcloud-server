import { Logger } from '@core/logger';
import {
	cacheImplementations,
	ContentTypeCache,
	H5PConfig,
	ILibraryAdministrationOverviewItem,
	LibraryAdministration,
	LibraryManager,
} from '@lumieducation/h5p-server';
import ContentManager from '@lumieducation/h5p-server/build/src/ContentManager';
import ContentTypeInformationRepository from '@lumieducation/h5p-server/build/src/ContentTypeInformationRepository';
import { ILibraryInstallResult, ILibraryName } from '@lumieducation/h5p-server/build/src/types';
import { ContentStorage, LibraryStorage } from '@modules/h5p-editor';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawnSync } from 'child_process';
import { parse } from 'yaml';
import { H5pDefaultUserFactory } from '../factory';
import { FileSystemHelper } from '../helper';
import {
	H5PLibraryManagementErrorLoggable,
	H5PLibraryManagementInstallResultsLoggable,
	H5PLibraryManagementLoggable,
	H5PLibraryManagementMetricsLoggable,
} from '../loggable';
import { H5pGitHubClient } from './h5p-github.client';
import { IH5PLibraryManagementConfig } from './h5p-library-management.config';
import LibraryManagementPermissionSystem from './library-management-permission-system';

const h5pConfig = new H5PConfig(undefined, {
	baseUrl: '/api/v3/h5p-editor',
	contentUserStateSaveInterval: false,
	setFinishedEnabled: false,
	installLibraryLockMaxOccupationTime: 30000,
});

interface LibrariesContentType {
	h5p_libraries: string[];
}

function isLibrariesContentType(object: unknown): object is LibrariesContentType {
	const isType =
		typeof object === 'object' &&
		!Array.isArray(object) &&
		object !== null &&
		'h5p_libraries' in object &&
		Array.isArray(object.h5p_libraries);

	return isType;
}

export const castToLibrariesContentType = (object: unknown): LibrariesContentType => {
	if (!isLibrariesContentType(object)) {
		throw new InternalServerErrorException('Invalid input type for castToLibrariesContentType');
	}

	return object;
};

function inputIsObjectWithPath(obj: unknown): obj is { path: string } {
	return typeof obj === 'object' && obj !== null && 'path' in obj && typeof obj.path === 'string';
}

@Injectable()
export class H5PLibraryManagementService {
	// TODO: should all this prop private? -> check constructor setup
	public contentTypeCache: ContentTypeCache;
	public contentTypeRepo: ContentTypeInformationRepository;
	public libraryManager: LibraryManager;
	public libraryAdministration: LibraryAdministration;
	public libraryWishList: string[];

	constructor(
		private readonly libraryStorage: LibraryStorage,
		private readonly contentStorage: ContentStorage,
		private readonly configService: ConfigService<IH5PLibraryManagementConfig, true>,
		private readonly githubClient: H5pGitHubClient,
		private readonly logger: Logger
	) {
		const kvCache = new cacheImplementations.CachedKeyValueStorage('kvcache');
		this.contentTypeCache = new ContentTypeCache(h5pConfig, kvCache);
		this.libraryManager = new LibraryManager(
			this.libraryStorage,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			h5pConfig
		);
		const permissionSystem = new LibraryManagementPermissionSystem();
		this.contentTypeRepo = new ContentTypeInformationRepository(
			this.contentTypeCache,
			this.libraryManager,
			h5pConfig,
			permissionSystem
		);
		const contentManager = new ContentManager(this.contentStorage, permissionSystem);
		this.libraryAdministration = new LibraryAdministration(this.libraryManager, contentManager);
		const filePath = this.configService.get<string>('H5P_EDITOR__LIBRARY_LIST_PATH');

		const librariesYamlContent = FileSystemHelper.readFile(filePath);
		const librariesContentType = castToLibrariesContentType(parse(librariesYamlContent));
		this.libraryWishList = librariesContentType.h5p_libraries;

		this.logger.setContext(H5PLibraryManagementService.name);
	}

	public async run(): Promise<void> {
		this.logger.info(new H5PLibraryManagementLoggable('Starting H5P library management job...'));
		let availableLibraries = await this.libraryAdministration.getLibraries();
		const uninstalledLibraries = await this.uninstallUnwantedLibraries(this.libraryWishList);

		// TODO: is this here still required?
		availableLibraries = await this.libraryAdministration.getLibraries();
		const installedLibraries = await this.installLibrariesAsBulk(availableLibraries);

		this.logger.info(new H5PLibraryManagementLoggable('Finished H5P library management job!'));
		this.logger.info(
			new H5PLibraryManagementMetricsLoggable(availableLibraries, uninstalledLibraries, installedLibraries)
		);
	}

	private async installLibrariesAsBulk(
		availableLibraries: ILibraryAdministrationOverviewItem[]
	): Promise<ILibraryInstallResult[]> {
		const installedLibraries: ILibraryInstallResult[] = [];
		const availableVersions = this.getAvailableVersions(availableLibraries);

		for (const library of this.libraryWishList) {
			const installResults = await this.installLibrary(library, availableVersions);
			installedLibraries.push(...installResults);
		}

		return installedLibraries;
	}

	private async installLibrary(library: string, availableVersions: string[]): Promise<ILibraryInstallResult[]> {
		this.logLibraryBanner(library);

		const installResultH5pHub = await this.installLatestLibraryVersionFromH5pHub(library);
		this.addInstalLResultsToAvailableVersions(installResultH5pHub, availableVersions);

		// TODO: ? availableVersions raus ziehen?
		const installResultGithub = await this.installPreviousLibraryVersionsFromGitHub(library, availableVersions);

		const installResults = [...installResultH5pHub, ...installResultGithub];

		return installResults;
	}

	public async uninstallUnwantedLibraries(wantedLibraries: string[]): Promise<ILibraryAdministrationOverviewItem[]> {
		let librariesToCheck: ILibraryAdministrationOverviewItem[] = [];
		let uninstalledLibraries: ILibraryAdministrationOverviewItem[];
		let allUninstalledLibraries: ILibraryAdministrationOverviewItem[] = [];

		do {
			librariesToCheck = await this.libraryAdministration.getLibraries();
			uninstalledLibraries = await this.uninstallUnwantedLibrariesOnce(wantedLibraries, librariesToCheck);
			allUninstalledLibraries = [...allUninstalledLibraries, ...uninstalledLibraries];
		} while (uninstalledLibraries.length > 0);

		return allUninstalledLibraries;
	}

	private async uninstallUnwantedLibrariesOnce(
		wantedLibraries: string[],
		librariesToCheck: ILibraryAdministrationOverviewItem[]
	): Promise<ILibraryAdministrationOverviewItem[]> {
		if (librariesToCheck.length === 0) {
			return [];
		}

		const lastPositionLibrariesToCheckArray = librariesToCheck.length - 1;
		const libraryToBeUninstalled = librariesToCheck[lastPositionLibrariesToCheckArray];
		const libraryCanBeUninstalled =
			!wantedLibraries.includes(libraryToBeUninstalled.machineName) && libraryToBeUninstalled.dependentsCount === 0;

		if (libraryCanBeUninstalled) {
			// force removal, don't let content prevent it, therefore use libraryStorage directly
			// also to avoid conflicts, remove one-by-one, not using for-await:
			await this.libraryStorage.deleteLibrary(libraryToBeUninstalled);
		}

		const uninstalledLibraries = await this.uninstallUnwantedLibrariesOnce(
			wantedLibraries,
			librariesToCheck.slice(0, lastPositionLibrariesToCheckArray)
		);

		if (!libraryCanBeUninstalled) {
			return uninstalledLibraries;
		}

		const result = [libraryToBeUninstalled, ...uninstalledLibraries];

		return result;
	}

	private async checkContentTypeExistsOnH5pHub(library: string): Promise<boolean> {
		const contentType = await this.contentTypeCache.get(library);
		const contentTypeExists = !(contentType === undefined);

		return contentTypeExists;
	}

	public async installLatestLibraryVersionFromH5pHub(library: string): Promise<ILibraryInstallResult[]> {
		this.logger.info(new H5PLibraryManagementLoggable(`Start installation of ${library} from H5P Hub.`));

		const contentTypeExists = await this.checkContentTypeExistsOnH5pHub(library);
		if (!contentTypeExists) {
			this.logger.info(
				new H5PLibraryManagementLoggable(`Content type ${library} does not exist on H5P Hub. Skipping installation.`)
			);

			return [];
		}

		let installResults: ILibraryInstallResult[] = [];

		try {
			const h5pDefaultUser = H5pDefaultUserFactory.create();
			installResults = await this.contentTypeRepo.installContentType(library, h5pDefaultUser);

			// TODO: Zusammenfassen?
			this.logger.info(new H5PLibraryManagementInstallResultsLoggable(installResults));
			this.logger.info(new H5PLibraryManagementLoggable(`Finished installation of ${library} from H5P Hub.`));
		} catch (error: unknown) {
			this.logger.warning(new H5PLibraryManagementErrorLoggable(error, { library }));
		}

		return installResults;
	}

	private async installPreviousLibraryVersionsFromGitHub(
		library: string,
		availableVersions: string[]
	): Promise<ILibraryInstallResult[]> {
		const result: ILibraryInstallResult[] = [];

		const repoName = this.githubClient.mapMachineNameToGitHubRepo(library);
		if (!repoName) {
			this.logger.info(
				new H5PLibraryManagementLoggable(`No GitHub repository found for ${library}. Skipping installation.`)
			);
			return [];
		}

		const tags = await this.githubClient.fetchGitHubTags(repoName);
		const filteredTags = this.getHighestPatchTags(tags);

		for (const tag of filteredTags) {
			const tagResult = await this.installLibraryVersionAndDependencies(library, tag, repoName, availableVersions);
			result.push(...tagResult);
		}

		return result;
	}

	private async installLibraryVersionAndDependencies(
		library: string,
		tag: string,
		repoName: string,
		availableVersions: string[]
	): Promise<ILibraryInstallResult[]> {
		const result: ILibraryInstallResult[] = [];

		const currentPatchVersionAvailable = this.isCurrentVersionAvailable(library, tag, availableVersions);
		if (currentPatchVersionAvailable) {
			this.logger.info(
				new H5PLibraryManagementLoggable(`${library}-${tag} is already installed. Skipping installation.`)
			);
			return [];
		}

		const newerPatchVersionAvailable = this.isNewerPatchVersionAvailable(library, tag, availableVersions);
		if (newerPatchVersionAvailable) {
			this.logger.info(
				new H5PLibraryManagementLoggable(
					`A newer patch version of ${library}-${tag} is already installed. Skipping installation.`
				)
			);
			return [];
		}

		this.logger.info(new H5PLibraryManagementLoggable(`Start installation of ${library}-${tag} from GitHub.`));
		const libResult = await this.installLibraryTagFromGitHub(repoName, tag);
		if (libResult) {
			result.push(libResult);
			this.logger.info(new H5PLibraryManagementLoggable(`Successfully installed ${library}-${tag} from GitHub.`));
		} else {
			return [];
		}

		this.logger.info(
			new H5PLibraryManagementLoggable(`Start installation of dependencies for ${library}-${tag} from GitHub.`)
		);
		availableVersions.push(`${library}-${tag}`);

		const [tagMajor, tagMinor] = tag.split('.').map(Number);
		const libraryName: ILibraryName = {
			machineName: library,
			majorVersion: tagMajor,
			minorVersion: tagMinor,
		};
		const installedLibrary = await this.libraryManager.getLibrary(libraryName);
		const dependencies = (installedLibrary?.preloadedDependencies ?? []).concat(
			installedLibrary?.editorDependencies ?? [],
			installedLibrary?.dynamicDependencies ?? []
		);
		if (dependencies.length === 0) {
			this.logger.info(new H5PLibraryManagementLoggable(`No dependencies found for ${library}-${tag}.`));
			return libResult ? [libResult] : [];
		}

		for (const dependency of dependencies) {
			const depName = dependency.machineName;
			const depMajor = dependency.majorVersion;
			const depMinor = dependency.minorVersion;
			const depRepoName = this.githubClient.mapMachineNameToGitHubRepo(depName);
			if (!depRepoName) {
				this.logger.info(
					new H5PLibraryManagementLoggable(`No GitHub repository found for ${depName}. Skipping installation.`)
				);
				continue;
			}

			const tags = await this.githubClient.fetchGitHubTags(depRepoName);
			const depTag = this.getHighestVersionTags(tags, depMajor, depMinor);
			if (!depTag) {
				this.logger.info(
					new H5PLibraryManagementLoggable(
						`No suitable tag found for dependency ${depName}-${depMajor}.${depMinor}.x in ${depRepoName}. Skipping installation.`
					)
				);
				continue;
			}

			this.logger.info(
				new H5PLibraryManagementLoggable(
					`Installing dependency ${depName}-${depTag} from GitHub for ${library}-${tag}.`
				)
			);
			const depResult = await this.installLibraryVersionAndDependencies(
				depName,
				depTag,
				depRepoName,
				availableVersions
			);
			if (depResult.length > 0) {
				result.push(...depResult);
				this.logger.info(
					new H5PLibraryManagementLoggable(`Successfully installed dependency ${depName}-${depTag} from GitHub.`)
				);
			}
		}
		this.logger.info(
			new H5PLibraryManagementLoggable(`Finished installation of dependencies for ${library}-${tag} from GitHub.`)
		);

		return result;
	}

	private isLibraryBuildRequired(library: string, tag: string): boolean {
		const libraryBuildIsRequired =
			(library === 'h5p/h5p-drag-question' && tag === '1.13.15') ||
			(library === 'h5p/h5p-course-presentation' && tag === '1.25.33') ||
			(library === 'h5p/h5p-interactive-video' && tag === '1.26.40') ||
			(library === 'h5p/h5p-editor-audio-recorder' && tag === '1.0.12');

		return libraryBuildIsRequired;
	}

	private isLibraryPathCorrectionRequired(library: string, tag: string): boolean {
		const libraryPathCorrectionIsRequired = library === 'h5p/h5p-memory-game' && tag === '1.3.36';

		return libraryPathCorrectionIsRequired;
	}

	private executeLibraryPreInstallationHook(folderPath: string, library: string, tag: string): void {
		this.checkAndCorrectLibraryJsonVersion(folderPath, tag);

		if (this.isLibraryBuildRequired(library, tag)) {
			this.buildLibraryIfRequired(folderPath, library);
		}

		if (this.isLibraryPathCorrectionRequired(library, tag)) {
			this.checkAndCorrectLibraryJsonPaths(folderPath);
		}
	}

	private async installLibraryTagFromGitHub(library: string, tag: string): Promise<ILibraryInstallResult | undefined> {
		let result: ILibraryInstallResult | undefined;
		// TODO: wenn wir filePath vorher erstellen könnten würde der tempFolder hinter dem unzipFile verschwinden welches folderPath zurück gibt.
		// removeTemporaryFiles sollte dann auch nur folderPath als input brauchen.
		// Dann wäre es möglich ein pre and post hook zu erstellen.
		// Wenn man dann noch FileSystemHelper als Klasse instanziiert über ein factory könnte man dort noch mehr implizites Wissen weg kapseln.
		const { filePath, folderPath, tempFolder } = FileSystemHelper.createTempFolder(library, tag);
		await this.githubClient.downloadGitHubTag(library, tag, filePath);
		FileSystemHelper.unzipFile(filePath, tempFolder);

		// TODO: gefühlt gehört das in den try catch rein, es sind dafür aber viel zu viele try catch instanzen.
		// Genauso wie die downloadGitHubTag
		// Wenn das umgesetzt wäre könnte das return result in das try catch rein
		this.executeLibraryPreInstallationHook(folderPath, library, tag);

		try {
			result = await this.libraryManager.installFromDirectory(folderPath);
		} catch (error: unknown) {
			this.logger.warning(new H5PLibraryManagementErrorLoggable(error, { library, tag }, 'during installation'));
		} finally {
			FileSystemHelper.removeTemporaryFiles(filePath, folderPath);
		}

		return result;
	}

	private buildLibraryIfRequired(folderPath: string, library: string): void {
		try {
			if (FileSystemHelper.checkPackageJsonPath(folderPath)) {
				this.logger.info(new H5PLibraryManagementLoggable(`Running npm ci and npm run build in ${folderPath}`));
				const npmInstall = spawnSync('npm', ['ci'], { cwd: folderPath, stdio: 'inherit' });

				if (npmInstall.status !== 0) {
					throw new Error('npm ci failed');
				} else {
					const npmBuild = spawnSync('npm', ['run', 'build'], { cwd: folderPath, stdio: 'inherit' });
					if (npmBuild.status !== 0) {
						throw new Error('npm run build failed');
					}
					FileSystemHelper.removeNodeModulesPathIfExists(folderPath, this.logger);
				}
			}
		} catch (error) {
			this.logger.warning(new H5PLibraryManagementErrorLoggable(error, { library, folderPath }));
		}
	}

	private checkAndCorrectLibraryJsonVersion(folderPath: string, tag: string): boolean {
		const libraryJsonPath = FileSystemHelper.getLibraryJsonPath(folderPath);
		let changed = false;
		try {
			const json = FileSystemHelper.readLibraryJson(libraryJsonPath);
			const [tagMajor, tagMinor, tagPatch] = tag.split('.').map(Number);
			if (json.majorVersion !== tagMajor || json.minorVersion !== tagMinor || json.patchVersion !== tagPatch) {
				json.majorVersion = tagMajor;
				json.minorVersion = tagMinor;
				json.patchVersion = tagPatch;
				FileSystemHelper.writeLibraryJson(libraryJsonPath, json);
				changed = true;
				this.logger.info(
					new H5PLibraryManagementLoggable(`Corrected version in library.json to match tag ${tag} in ${folderPath}.`)
				);
			}
		} catch (error) {
			this.logger.warning(
				new H5PLibraryManagementErrorLoggable(error, { folderPath }, 'reading or correcting library.json')
			);
		}
		return changed;
	}

	private checkAndCorrectLibraryJsonPaths(folderPath: string): boolean {
		const libraryJsonPath = FileSystemHelper.getLibraryJsonPath(folderPath);
		let changed = false;
		try {
			const json = FileSystemHelper.readLibraryJson(libraryJsonPath);

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
							if (inputIsObjectWithPath(dep)) {
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
						const filteredFiles = json[key].filter((file: { path: string }) => {
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
				FileSystemHelper.writeLibraryJson(libraryJsonPath, json);
				this.logger.info(
					new H5PLibraryManagementLoggable(
						`Corrected file paths in library.json to only contain available files in ${folderPath}.`
					)
				);
			}
		} catch (error) {
			this.logger.warning(
				new H5PLibraryManagementErrorLoggable(error, { folderPath }, 'reading or correcting library.json file paths')
			);
		}
		return changed;
	}

	private logLibraryBanner(libraryName: string): void {
		const name = `*   ${libraryName}   *`;
		const border = '*'.repeat(name.length);
		this.logger.info(new H5PLibraryManagementLoggable(border));
		this.logger.info(new H5PLibraryManagementLoggable(name));
		this.logger.info(new H5PLibraryManagementLoggable(border));
	}

	private getAvailableVersions(availableLibraries: ILibraryAdministrationOverviewItem[]): string[] {
		const availableVersions = availableLibraries.map(
			(lib) => `${lib.machineName}-${lib.majorVersion}.${lib.minorVersion}.${lib.patchVersion}`
		);

		return availableVersions;
	}

	private addInstalLResultsToAvailableVersions(
		installResult: ILibraryInstallResult[],
		availableVersions: string[]
	): void {
		const newVersions = installResult
			.filter((result) => result.type === 'new' || result.type === 'patch')
			.map(
				(result) =>
					`${result.newVersion?.machineName || ''}-${result.newVersion?.majorVersion || ''}.${
						result.newVersion?.minorVersion || ''
					}.${result.newVersion?.patchVersion || ''}`
			);
		availableVersions.push(...newVersions);
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

	private getHighestVersionTags(tags: string[], majorVersion: number, minorVersion: number): string | undefined {
		const matchingTags = tags.filter((t) => {
			const [maj, min] = t.split('.').map(Number);
			return maj === majorVersion && min === minorVersion;
		});
		let highestVersionTag: string | undefined;
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
		return currentPatchVersionAvailable;
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

		return newerPatchVersionAvailable;
	}
}
