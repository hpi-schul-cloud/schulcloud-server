import { Logger } from '@core/logger';
import {
	cacheImplementations,
	ContentTypeCache,
	H5PConfig,
	ILibraryAdministrationOverviewItem,
	IUser,
	LibraryAdministration,
	LibraryManager,
} from '@lumieducation/h5p-server';
import ContentManager from '@lumieducation/h5p-server/build/src/ContentManager';
import ContentTypeInformationRepository from '@lumieducation/h5p-server/build/src/ContentTypeInformationRepository';
import { ILibraryInstallResult, ILibraryName } from '@lumieducation/h5p-server/build/src/types';
import { ContentStorage, LibraryStorage } from '@modules/h5p-editor';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { components } from '@octokit/openapi-types';
import { Octokit } from '@octokit/rest';
import axios, { AxiosResponse } from 'axios';
import { spawnSync } from 'child_process';
import { createWriteStream, existsSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path, { join } from 'path';
import { parse } from 'yaml';
import { H5PLibraryHelper } from '../helper';
import {
	H5PLibraryManagementErrorLoggable,
	H5PLibraryManagementLoggable,
	H5PLibraryManagementMetricsLoggable,
} from '../loggable';
import { H5PLibraryMapper } from '../mapper';
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

@Injectable()
export class H5PLibraryManagementService {
	// should all this prop private?
	contentTypeCache: ContentTypeCache;

	contentTypeRepo: ContentTypeInformationRepository;

	libraryManager: LibraryManager;

	libraryAdministration: LibraryAdministration;

	libraryWishList: string[];

	constructor(
		private readonly libraryStorage: LibraryStorage,
		private readonly contentStorage: ContentStorage,
		private readonly configService: ConfigService<IH5PLibraryManagementConfig, true>,
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

		const librariesYamlContent = readFileSync(filePath, { encoding: 'utf-8' });
		const librariesContentType = castToLibrariesContentType(parse(librariesYamlContent));
		this.libraryWishList = librariesContentType.h5p_libraries;

		this.logger.setContext(H5PLibraryManagementService.name);
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

	private createDefaultIUser(): IUser {
		const user: IUser = {
			email: 'a@b.de',
			id: 'a',
			name: 'a',
			type: 'local',
		};

		return user;
	}

	public async installLatestLibraryVersionFromH5pHub(library: string): Promise<ILibraryInstallResult[]> {
		let result: ILibraryInstallResult[] = [];

		const contentTypeExists = await this.checkContentTypeExistsOnH5pHub(library);
		if (contentTypeExists) {
			const user = this.createDefaultIUser();

			try {
				this.logger.info(new H5PLibraryManagementLoggable(`Start installation of ${library} from H5P Hub.`));
				result = await this.contentTypeRepo.installContentType(library, user);
				this.logger.info(new H5PLibraryManagementLoggable(`Finished installation of ${library} from H5P Hub.`));
			} catch (error: unknown) {
				this.logger.warning(new H5PLibraryManagementErrorLoggable(library, error));
			}
		} else {
			this.logger.info(
				new H5PLibraryManagementLoggable(`Content type ${library} does not exist on H5P Hub. Skipping installation.`)
			);
		}

		return result;
	}

	private async installPreviousLibraryVersionsFromGitHub(library: string, availableVersions: string[]): Promise<void> {
		const repoName = H5PLibraryMapper.mapMachineNameToGitHubRepo(library);
		if (!repoName) {
			this.logger.info(
				new H5PLibraryManagementLoggable(`No GitHub repository found for ${library}. Skipping installation.`)
			);
			return;
		}

		const tags = await this.fetchGitHubTags(repoName);
		const filteredTags = H5PLibraryHelper.getHighestPatchTags(tags);

		for (const tag of filteredTags) {
			await this.installLibraryVersionAndDependencies(library, tag, repoName, availableVersions);
		}
	}

	public async run(): Promise<void> {
		this.logger.info(new H5PLibraryManagementLoggable('Starting H5P library management job...'));
		let availableLibraries = await this.libraryAdministration.getLibraries();
		const uninstalledLibraries = await this.uninstallUnwantedLibraries(this.libraryWishList);
		const installedLibraries: ILibraryInstallResult[] = [];

		availableLibraries = await this.libraryAdministration.getLibraries();
		const availableVersions = H5PLibraryHelper.getAvailableVersions(availableLibraries);

		for (const library of this.libraryWishList) {
			this.logLibraryBanner(library);
			await this.installLatestLibraryVersionFromH5pHub(library);
			await this.installPreviousLibraryVersionsFromGitHub(library, availableVersions);
		}

		this.logger.info(new H5PLibraryManagementLoggable('Finished H5P library management job!'));
		this.logger.info(
			new H5PLibraryManagementMetricsLoggable(availableLibraries, uninstalledLibraries, installedLibraries)
		);
	}

	private async installLibraryVersionAndDependencies(
		library: string,
		tag: string,
		repoName: string,
		availableVersions: string[]
	): Promise<void> {
		const currentPatchVersionAvailable = H5PLibraryHelper.isCurrentVersionAvailable(library, tag, availableVersions);
		if (currentPatchVersionAvailable) {
			this.logger.info(
				new H5PLibraryManagementLoggable(`${library}-${tag} is already installed. Skipping installation.`)
			);
			return;
		}

		const newerPatchVersionAvailable = H5PLibraryHelper.isNewerPatchVersionAvailable(library, tag, availableVersions);
		if (newerPatchVersionAvailable) {
			this.logger.info(
				new H5PLibraryManagementLoggable(
					`A newer patch version of ${library}-${tag} is already installed. Skipping installation.`
				)
			);
			return;
		}

		this.logger.info(new H5PLibraryManagementLoggable(`Start installation of ${library}-${tag} from GitHub.`));
		await this.installLibraryTagFromGitHub(repoName, tag);
		this.logger.info(new H5PLibraryManagementLoggable(`Finished installation of ${library}-${tag} from GitHub.`));

		availableVersions.push(`${library}-${tag}`);

		// check and update dependencies
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
			return;
		}

		for (const dependency of dependencies) {
			const depName = dependency.machineName;
			const depMajor = dependency.majorVersion;
			const depMinor = dependency.minorVersion;
			const depRepoName = H5PLibraryMapper.mapMachineNameToGitHubRepo(depName);
			if (!depRepoName) {
				this.logger.info(
					new H5PLibraryManagementLoggable(`No GitHub repository found for ${depName}. Skipping installation.`)
				);
				continue;
			}

			const tags = await this.fetchGitHubTags(depRepoName);
			const depTag = H5PLibraryHelper.getHighestVersionTags(tags, depMajor, depMinor);
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
			await this.installLibraryVersionAndDependencies(depName, depTag, depRepoName, availableVersions);
		}
	}

	private async fetchGitHubTags(repoName: string): Promise<string[]> {
		const octokit = new Octokit({
			// Replace with your GitHub personal access token
			// auth: 'GITHUB_PERSONAL_ACCESS_TOKEN',
		});
		let tags: string[] = [];

		try {
			const [owner, repo] = repoName.split('/');
			const response = await octokit.repos.listTags({
				owner,
				repo,
			});
			tags = response.data.map((tag: components['schemas']['tag']) => tag.name);
		} catch (error: unknown) {
			const loggableError =
				error instanceof Error
					? new H5PLibraryManagementErrorLoggable(repoName, error)
					: new H5PLibraryManagementErrorLoggable(repoName, new Error('Unknown error during fetching tags'));
			this.logger.warning(loggableError);
			tags = [];
		}

		return tags;
	}

	private async installLibraryTagFromGitHub(library: string, tag: string): Promise<void> {
		const tempFolder = tmpdir();
		const libraryName = library.split('/')[1];
		const filePath = join(tempFolder, `${libraryName}-${tag}.zip`);
		const folderPath = join(tempFolder, `${libraryName}-${tag}`);

		await this.downloadGitHubTag(library, tag, filePath);
		H5PLibraryHelper.unzipFile(filePath, tempFolder);
		this.checkAndCorrectLibraryJsonVersion(folderPath, tag);
		if (
			(library === 'h5p/h5p-drag-question' && tag === '1.13.15') ||
			(library === 'h5p/h5p-course-presentation' && tag === '1.25.33') ||
			(library === 'h5p/h5p-interactive-video' && tag === '1.26.40') ||
			(library === 'h5p/h5p-editor-audio-recorder' && tag === '1.0.12')
		) {
			this.buildLibraryIfRequired(folderPath, library);
		}
		if (library === 'h5p/h5p-memory-game' && tag === '1.3.36') {
			this.checkAndCorrectLibraryJsonPaths(folderPath);
		}

		try {
			await this.libraryManager.installFromDirectory(folderPath);
		} catch (error: unknown) {
			const loggableError =
				error instanceof Error
					? new H5PLibraryManagementErrorLoggable(library, error)
					: new H5PLibraryManagementErrorLoggable(library, new Error('Unknown error during installation'));
			this.logger.warning(loggableError);
		}
		H5PLibraryHelper.removeTemporaryFiles(filePath, folderPath);
	}

	private buildLibraryIfRequired(folderPath: string, library: string): void {
		const packageJsonPath = join(folderPath, 'package.json');
		if (existsSync(packageJsonPath)) {
			this.logger.info(new H5PLibraryManagementLoggable(`Running npm ci and npm run build in ${folderPath}`));
			const npmInstall = spawnSync('npm', ['ci'], { cwd: folderPath, stdio: 'inherit' });
			if (npmInstall.status !== 0) {
				this.logger.warning(new H5PLibraryManagementErrorLoggable(library, new Error('npm ci failed')));
			} else {
				const npmBuild = spawnSync('npm', ['run', 'build'], { cwd: folderPath, stdio: 'inherit' });
				if (npmBuild.status !== 0) {
					this.logger.warning(new H5PLibraryManagementErrorLoggable(library, new Error('npm run build failed')));
				}
				const nodeModulesPath = join(folderPath, 'node_modules');
				if (existsSync(nodeModulesPath)) {
					spawnSync('rm', ['-rf', 'node_modules'], { cwd: folderPath, stdio: 'inherit' });
					this.logger.info(new H5PLibraryManagementLoggable(`Removed node_modules from ${folderPath}`));
				}
			}
		}
	}

	private async downloadGitHubTag(library: string, tag: string, filePath: string): Promise<void> {
		const [owner, repo] = library.split('/');
		const url = `https://github.com/${owner}/${repo}/archive/refs/tags/${tag}.zip`;

		try {
			const response: AxiosResponse<ReadableStream> = await axios({
				url,
				method: 'GET',
				responseType: 'stream',
			});

			const writer = createWriteStream(filePath);
			(response.data as unknown as NodeJS.ReadableStream).pipe(writer);

			await new Promise<void>((resolve, reject) => {
				writer.on('finish', () => resolve());
				writer.on('error', (err) => reject(err));
			});

			this.logger.info(new H5PLibraryManagementLoggable(`Downloaded ${tag} of ${library} to ${filePath}`));
		} catch (error: unknown) {
			const loggableError =
				error instanceof Error
					? new H5PLibraryManagementErrorLoggable(library, error)
					: new H5PLibraryManagementErrorLoggable(library, new Error('Unknown error during download'));
			this.logger.warning(loggableError);
		}
	}

	private checkAndCorrectLibraryJsonVersion(folderPath: string, tag: string): boolean {
		const libraryJsonPath = path.join(folderPath, 'library.json');
		let changed = false;
		try {
			const content = readFileSync(libraryJsonPath, { encoding: 'utf-8' });
			const json = JSON.parse(content) as {
				majorVersion: number;
				minorVersion: number;
				patchVersion: number;
				[key: string]: unknown;
			};
			const [tagMajor, tagMinor, tagPatch] = tag.split('.').map(Number);
			if (json.majorVersion !== tagMajor || json.minorVersion !== tagMinor || json.patchVersion !== tagPatch) {
				json.majorVersion = tagMajor;
				json.minorVersion = tagMinor;
				json.patchVersion = tagPatch;
				writeFileSync(libraryJsonPath, JSON.stringify(json, null, 2), { encoding: 'utf-8' });
				changed = true;
				this.logger.info(
					new H5PLibraryManagementLoggable(`Corrected version in library.json to match tag ${tag} in ${folderPath}`)
				);
			}
		} catch (err) {
			this.logger.warning(
				new H5PLibraryManagementErrorLoggable(
					folderPath,
					err instanceof Error ? err : new Error('Unknown error reading or correcting library.json')
				)
			);
		}
		return changed;
	}

	private checkAndCorrectLibraryJsonPaths(folderPath: string): boolean {
		const libraryJsonPath = path.join(folderPath, 'library.json');
		let changed = false;
		try {
			const content = readFileSync(libraryJsonPath, { encoding: 'utf-8' });
			const json = JSON.parse(content) as { [key: string]: any };

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
						const filteredDeps = json[key].filter((dep: any) => {
							if (dep.path) {
								const depPath = path.join(folderPath, dep.path);
								return existsSync(depPath);
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
							const filePath = path.join(folderPath, file.path);
							return existsSync(filePath);
						});
						if (filteredFiles.length !== json[key].length) {
							json[key] = filteredFiles;
							changed = true;
						}
					}
				}
			}

			if (changed) {
				writeFileSync(libraryJsonPath, JSON.stringify(json, null, 2), { encoding: 'utf-8' });
				this.logger.info(
					new H5PLibraryManagementLoggable(
						`Corrected file paths in library.json to only contain available files in ${folderPath}`
					)
				);
			}
		} catch (err) {
			this.logger.warning(
				new H5PLibraryManagementErrorLoggable(
					folderPath,
					err instanceof Error ? err : new Error('Unknown error reading or correcting library.json file paths')
				)
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
}
