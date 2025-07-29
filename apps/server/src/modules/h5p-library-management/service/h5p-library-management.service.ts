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
import { IHubContentType, ILibraryInstallResult, ILibraryName } from '@lumieducation/h5p-server/build/src/types';
import { ContentStorage, LibraryStorage } from '@modules/h5p-editor';
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
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

	private checkContentTypeExists(contentType: IHubContentType[]): void {
		if (contentType === undefined) {
			throw new NotFoundException('this library does not exist');
		}
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

	public async installLibraries(librariesToInstall: string[]): Promise<ILibraryInstallResult[]> {
		if (librariesToInstall.length === 0) {
			return [];
		}
		const lastPositionLibrariesToInstallArray = librariesToInstall.length - 1;
		const libraryToBeInstalled = librariesToInstall[lastPositionLibrariesToInstallArray];
		// avoid conflicts, install one-by-one:
		const contentType = await this.contentTypeCache.get(libraryToBeInstalled);
		this.checkContentTypeExists(contentType);

		const user = this.createDefaultIUser();

		let installResults: ILibraryInstallResult[] = [];

		try {
			installResults = await this.contentTypeRepo.installContentType(libraryToBeInstalled, user);
		} catch (error: unknown) {
			this.logger.warning(new H5PLibraryManagementErrorLoggable(libraryToBeInstalled, error));
		}

		const installedLibraries = await this.installLibraries(
			librariesToInstall.slice(0, lastPositionLibrariesToInstallArray)
		);

		const result = [...installResults, ...installedLibraries];

		return result;
	}

	public async run(): Promise<void> {
		this.logger.info(new H5PLibraryManagementLoggable('Starting H5P library management job...'));
		let availableLibraries = await this.libraryAdministration.getLibraries();
		const uninstalledLibraries = await this.uninstallUnwantedLibraries(this.libraryWishList);
		const installedLibraries = await this.installLibraries(this.libraryWishList);
		this.logger.info(new H5PLibraryManagementLoggable('Finished H5P library management job!'));
		this.logger.info(
			new H5PLibraryManagementMetricsLoggable(availableLibraries, uninstalledLibraries, installedLibraries)
		);

		availableLibraries = await this.libraryAdministration.getLibraries();
		const availableVersions = H5PLibraryHelper.getAvailableVersions(availableLibraries);

		for (const library of this.libraryWishList) {
			const repoName = H5PLibraryMapper.mapMachineNameToGitHubRepo(library);
			if (!repoName) {
				this.logger.info(
					new H5PLibraryManagementLoggable(`No GitHub repository found for ${library}. Skipping installation.`)
				);
				continue;
			}

			const tags = await this.fetchGitHubTags(repoName);
			const filteredTags = H5PLibraryHelper.getHighestPatchTags(tags);

			for (const tag of filteredTags) {
				await this.installLibraryVersionAndDependencies(library, tag, repoName, availableVersions);
			}
		}
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
		// this.buildLibraryIfRequired(folderPath, library);

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
			this.logger.info(new H5PLibraryManagementLoggable(`Running npm install and npm run build in ${folderPath}`));
			const npmInstall = spawnSync('npm', ['install'], { cwd: folderPath, stdio: 'inherit' });
			if (npmInstall.status !== 0) {
				this.logger.warning(new H5PLibraryManagementErrorLoggable(library, new Error('npm install failed')));
			} else {
				const npmBuild = spawnSync('npm', ['run', 'build'], { cwd: folderPath, stdio: 'inherit' });
				if (npmBuild.status !== 0) {
					this.logger.warning(new H5PLibraryManagementErrorLoggable(library, new Error('npm run build failed')));
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
}
