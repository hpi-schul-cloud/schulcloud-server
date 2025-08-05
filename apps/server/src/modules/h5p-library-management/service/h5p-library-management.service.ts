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
import { ILibraryInstallResult } from '@lumieducation/h5p-server/build/src/types';
import { ContentStorage, LibraryStorage } from '@modules/h5p-editor';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
		this.logStartH5pLibraryManagementJob();
		const availableLibraries = await this.libraryAdministration.getLibraries();

		const uninstalledLibraries = await this.uninstallUnwantedLibraries(availableLibraries);

		const installedLibraries = await this.installLibrariesAsBulk(availableLibraries);

		this.logFinishH5pLibraryManagementJob(availableLibraries, uninstalledLibraries, installedLibraries);
	}

	private logStartH5pLibraryManagementJob(): void {
		this.logger.info(new H5PLibraryManagementLoggable('Starting H5P library management job...'));
	}

	private logFinishH5pLibraryManagementJob(
		availableLibraries: ILibraryAdministrationOverviewItem[],
		uninstalledLibraries: ILibraryAdministrationOverviewItem[],
		installedLibraries: ILibraryInstallResult[]
	): void {
		this.logger.info(new H5PLibraryManagementLoggable('Finished H5P library management job!'));
		this.logger.info(
			new H5PLibraryManagementMetricsLoggable(availableLibraries, uninstalledLibraries, installedLibraries)
		);
	}

	public async uninstallUnwantedLibraries(
		availableLibraries: ILibraryAdministrationOverviewItem[]
	): Promise<ILibraryAdministrationOverviewItem[]> {
		const unwantedLibraries = this.getUnwantedLibraries(availableLibraries);
		const result: ILibraryAdministrationOverviewItem[] = [];

		for (const library of unwantedLibraries) {
			// to avoid conflicts, remove one-by-one
			const success = await this.forceUninstallLibrary(library);
			if (success) {
				result.push(library);
			}
		}

		return result;
	}

	private getUnwantedLibraries(
		availableLibraries: ILibraryAdministrationOverviewItem[]
	): ILibraryAdministrationOverviewItem[] {
		const unwantedLibraries = availableLibraries
			.filter((lib) => !this.libraryWishList.includes(lib.machineName) && lib.dependentsCount === 0)
			.map((lib) => {
				return { ...lib };
			});

		return unwantedLibraries;
	}

	private async forceUninstallLibrary(unwantedLibrary: ILibraryAdministrationOverviewItem): Promise<boolean> {
		this.logStartForceUninstallLibrary(unwantedLibrary.machineName);
		let result = false;
		try {
			await this.libraryStorage.deleteLibrary(unwantedLibrary);
			result = true;
		} catch (error: unknown) {
			this.logger.warning(
				new H5PLibraryManagementErrorLoggable(error, { library: unwantedLibrary.machineName }, 'during force uninstall')
			);
		}
		this.logFinishedForceUninstallLibrary(unwantedLibrary.machineName);

		return result;
	}

	private logStartForceUninstallLibrary(library: string): void {
		this.logger.info(new H5PLibraryManagementLoggable(`Start removal of unwanted library ${library}.`));
	}

	private logFinishedForceUninstallLibrary(library: string): void {
		this.logger.info(new H5PLibraryManagementLoggable(`Finished removal of unwanted library ${library}.`));
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

	private getAvailableVersions(availableLibraries: ILibraryAdministrationOverviewItem[]): string[] {
		const availableVersions = availableLibraries.map(
			(lib) => `${lib.machineName}-${lib.majorVersion}.${lib.minorVersion}.${lib.patchVersion}`
		);

		return availableVersions;
	}

	private async installLibrary(library: string, availableVersions: string[]): Promise<ILibraryInstallResult[]> {
		this.logLibraryBanner(library);

		const installResults = await this.installLatestLibraryVersionFromH5pHub(library);
		this.addInstallResultsToAvailableVersions(installResults, availableVersions);

		return installResults;
	}

	private logLibraryBanner(libraryName: string): void {
		const name = `*   ${libraryName}   *`;
		const border = '*'.repeat(name.length);
		this.logger.info(new H5PLibraryManagementLoggable(border));
		this.logger.info(new H5PLibraryManagementLoggable(name));
		this.logger.info(new H5PLibraryManagementLoggable(border));
	}

	public async installLatestLibraryVersionFromH5pHub(library: string): Promise<ILibraryInstallResult[]> {
		this.logStartInstallationOfCurrentVersionFromH5pHub(library);

		const contentTypeExists = await this.checkContentTypeExistsOnH5pHub(library);
		if (!contentTypeExists) {
			this.logContentTypeNotFoundOnH5pHub(library);
			return [];
		}

		let installResults: ILibraryInstallResult[] = [];

		try {
			const h5pDefaultUser = H5pDefaultUserFactory.create();
			installResults = await this.contentTypeRepo.installContentType(library, h5pDefaultUser);
			this.logFinishedInstallationOfCurrentVersionFromH5pHub(library, installResults);
		} catch (error: unknown) {
			this.logger.warning(new H5PLibraryManagementErrorLoggable(error, { library }));
		}

		return installResults;
	}

	private logStartInstallationOfCurrentVersionFromH5pHub(library: string): void {
		this.logger.info(
			new H5PLibraryManagementLoggable(`Start installation of current version of ${library} from H5P Hub.`)
		);
	}

	private async checkContentTypeExistsOnH5pHub(library: string): Promise<boolean> {
		const contentType = await this.contentTypeCache.get(library);
		const contentTypeExists = !(contentType === undefined);

		return contentTypeExists;
	}

	private logContentTypeNotFoundOnH5pHub(library: string): void {
		this.logger.info(
			new H5PLibraryManagementLoggable(`Content type ${library} does not exist on H5P Hub. Skipping installation.`)
		);
	}

	private logFinishedInstallationOfCurrentVersionFromH5pHub(
		library: string,
		installResults: ILibraryInstallResult[]
	): void {
		this.logger.info(new H5PLibraryManagementInstallResultsLoggable(installResults));
		this.logger.info(
			new H5PLibraryManagementLoggable(`Finished installation of current version of ${library} from H5P Hub.`)
		);
	}

	private addInstallResultsToAvailableVersions(
		installResult: ILibraryInstallResult[],
		availableVersions: string[]
	): void {
		const newVersions = installResult
			.filter((result) => result.type === 'new' || result.type === 'patch')
			.map(
				(result) =>
					`${result.newVersion?.machineName ?? ''}-${result.newVersion?.majorVersion ?? ''}.${
						result.newVersion?.minorVersion ?? ''
					}.${result.newVersion?.patchVersion ?? ''}`
			);
		availableVersions.push(...newVersions);
	}
}
