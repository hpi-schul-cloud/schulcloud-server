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
import {
	IFullLibraryName,
	IInstalledLibrary,
	ILibraryInstallResult,
	ILibraryMetadata,
	ILibraryName,
} from '@lumieducation/h5p-server/build/src/types';
import { ContentStorage, LibraryStorage } from '@modules/h5p-editor';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import { Readable } from 'stream';
import { parse } from 'yaml';
import { H5pDefaultUserFactory } from '../factory';
import {
	H5PLibraryManagementErrorLoggable,
	H5PLibraryManagementInstallResultsLoggable,
	H5PLibraryManagementLoggable,
	H5PLibraryManagementMetricsLoggable,
} from '../loggable';
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

	public async run(): Promise<void> {
		this.logStartH5pLibraryManagementJob();
		const availableLibraries = await this.libraryAdministration.getLibraries();

		const uninstalledLibraries = await this.uninstallUnwantedLibrariesAsBulk();

		const installedLibraries = await this.installLibrariesAsBulk(availableLibraries);

		const synchronizedLibraries = await this.synchronizeLibraries();

		this.logFinishH5pLibraryManagementJob(
			availableLibraries,
			uninstalledLibraries,
			installedLibraries,
			synchronizedLibraries
		);
	}

	private logStartH5pLibraryManagementJob(): void {
		this.logger.info(new H5PLibraryManagementLoggable('Starting H5P library management job...'));
	}

	private logFinishH5pLibraryManagementJob(
		availableLibraries: ILibraryAdministrationOverviewItem[],
		uninstalledLibraries: ILibraryAdministrationOverviewItem[],
		installedLibraries: ILibraryInstallResult[],
		synchronizedLibraries: ILibraryInstallResult[]
	): void {
		this.logger.info(new H5PLibraryManagementLoggable('Finished H5P library management job!'));
		this.logger.info(
			new H5PLibraryManagementMetricsLoggable(
				availableLibraries,
				uninstalledLibraries,
				installedLibraries,
				synchronizedLibraries
			)
		);
	}

	public async uninstallUnwantedLibrariesAsBulk(): Promise<ILibraryAdministrationOverviewItem[]> {
		let availableLibraries: ILibraryAdministrationOverviewItem[] = [];
		let uninstalledLibraries: ILibraryAdministrationOverviewItem[] = [];
		let failedLibraries: ILibraryAdministrationOverviewItem[] = [];
		const allUninstalledLibraries: ILibraryAdministrationOverviewItem[] = [];
		const allFailedLibraries: ILibraryAdministrationOverviewItem[] = [];

		do {
			availableLibraries = await this.libraryAdministration.getLibraries();
			if (allFailedLibraries.length > 0) {
				const failedSet = new Set(allFailedLibraries.map((lib) => lib.machineName));
				availableLibraries = availableLibraries.filter((lib) => !failedSet.has(lib.machineName));
			}
			const result = await this.uninstallUnwantedLibraries(availableLibraries);
			({ uninstalledLibraries, failedLibraries } = result);
			allUninstalledLibraries.push(...uninstalledLibraries);
			allFailedLibraries.push(...failedLibraries);
		} while (uninstalledLibraries.length > 0);

		return allUninstalledLibraries;
	}

	public async uninstallUnwantedLibraries(availableLibraries: ILibraryAdministrationOverviewItem[]): Promise<{
		uninstalledLibraries: ILibraryAdministrationOverviewItem[];
		failedLibraries: ILibraryAdministrationOverviewItem[];
	}> {
		const unwantedLibraries = this.getUnwantedLibraries(availableLibraries);
		const uninstalledLibraries: ILibraryAdministrationOverviewItem[] = [];
		const failedLibraries: ILibraryAdministrationOverviewItem[] = [];

		for (const library of unwantedLibraries) {
			// to avoid conflicts, remove one-by-one
			const success = await this.forceUninstallLibrary(library);
			if (success) {
				uninstalledLibraries.push(library);
			} else {
				failedLibraries.push(library);
			}
		}
		const result = { uninstalledLibraries, failedLibraries };

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

	public async installLibrariesAsBulk(
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

	public async synchronizeLibraries(): Promise<ILibraryInstallResult[]> {
		const synchronizedLibraries: ILibraryInstallResult[] = [];
		const folders = await this.libraryStorage.getAllLibraryFolders();

		for (const folder of folders) {
			const libraryName = this.getLibraryNameFromFolder(folder);
			const libraryJsonExistsInS3 = await this.libraryStorage.fileExists(libraryName, 'library.json');
			if (libraryJsonExistsInS3) {
				const result = await this.synchronizeLibraryFromS3(libraryName);
				if (result.type === 'new' || result.type === 'patch') {
					synchronizedLibraries.push(result);
				}
			} else {
				await this.synchronizeLibraryToS3(libraryName);
			}
		}

		return synchronizedLibraries;
	}

	private getLibraryNameFromFolder(folder: string): ILibraryName {
		const [machineName, version] = folder.split('-');
		const [majorVersion, minorVersion] = version.split('.');
		const libraryName: ILibraryName = {
			machineName,
			majorVersion: Number(majorVersion),
			minorVersion: Number(minorVersion),
		};

		return libraryName;
	}

	private async synchronizeLibraryFromS3(libraryName: ILibraryName): Promise<ILibraryInstallResult> {
		const newLibraryMetadata: ILibraryMetadata = (await this.libraryStorage.getFileAsJson(
			libraryName,
			'library.json',
			true
		)) as ILibraryMetadata;
		const newVersion: IFullLibraryName = {
			machineName: newLibraryMetadata.machineName,
			majorVersion: newLibraryMetadata.majorVersion,
			minorVersion: newLibraryMetadata.minorVersion,
			patchVersion: newLibraryMetadata.patchVersion,
		};

		const libraryIsInstalled = await this.libraryStorage.isInstalled(libraryName);
		if (libraryIsInstalled) {
			const oldVersion = await this.libraryManager.isPatchedLibrary(newLibraryMetadata);
			if (oldVersion) {
				await this.updateLibrary(newLibraryMetadata);
				this.logLibraryUpdated(oldVersion, newVersion);
				const result: ILibraryInstallResult = {
					type: 'patch',
					oldVersion,
					newVersion,
				};

				return result;
			}
			this.logLibraryAlreadyInstalled(newVersion);
			const result: ILibraryInstallResult = {
				type: 'none',
			};

			return result;
		}

		await this.addLibrary(newLibraryMetadata);
		this.logLibraryAdded(newVersion);
		const result: ILibraryInstallResult = {
			type: 'new',
			newVersion,
		};

		return result;
	}

	private async updateLibrary(newLibraryMetadata: ILibraryMetadata): Promise<void> {
		try {
			await this.libraryStorage.updateLibrary(newLibraryMetadata);
			await this.checkConsistency(newLibraryMetadata);
		} catch (error: unknown) {
			this.logger.warning(
				new H5PLibraryManagementErrorLoggable(
					error,
					{ library: newLibraryMetadata.machineName },
					'during library update'
				)
			);
			this.logRemoveLibraryDueToError(newLibraryMetadata);
			await this.libraryStorage.deleteLibrary(newLibraryMetadata);
		}
	}

	private logRemoveLibraryDueToError(library: ILibraryMetadata): void {
		this.logger.warning(
			new H5PLibraryManagementLoggable(
				`Removing library ${library.machineName}-${library.majorVersion}.${library.minorVersion} due to error.`
			)
		);
	}

	private logLibraryUpdated(oldVersion: IFullLibraryName, newVersion: IFullLibraryName): void {
		this.logger.info(
			new H5PLibraryManagementLoggable(
				`Updated library: ${oldVersion.machineName}-${oldVersion.majorVersion}.${oldVersion.minorVersion} to ${newVersion.machineName}-${newVersion.majorVersion}.${newVersion.minorVersion}`
			)
		);
	}

	private logLibraryAlreadyInstalled(newVersion: IFullLibraryName): void {
		this.logger.info(
			new H5PLibraryManagementLoggable(
				`Library ${newVersion.machineName}-${newVersion.majorVersion}.${newVersion.minorVersion} is already installed.`
			)
		);
	}

	private async addLibrary(newLibraryMetadata: ILibraryMetadata): Promise<void> {
		try {
			await this.libraryStorage.addLibrary(newLibraryMetadata, false);
			await this.checkConsistency(newLibraryMetadata);
		} catch (error: unknown) {
			this.logger.warning(
				new H5PLibraryManagementErrorLoggable(
					error,
					{ library: newLibraryMetadata.machineName },
					'during library installation'
				)
			);
		}
	}

	private logLibraryAdded(newVersion: IFullLibraryName): void {
		this.logger.info(
			new H5PLibraryManagementLoggable(
				`Added library: ${newVersion.machineName}-${newVersion.majorVersion}.${newVersion.minorVersion}.${newVersion.patchVersion}`
			)
		);
	}

	private async checkConsistency(library: ILibraryName): Promise<boolean> {
		const libraryIsInstalled = await this.libraryStorage.isInstalled(library);
		if (!libraryIsInstalled) {
			this.logLibraryIsNotInstalled(library);

			return false;
		}

		let metadata: IInstalledLibrary | undefined = undefined;
		try {
			metadata = await this.libraryStorage.getLibrary(library);
		} catch (error) {
			this.logger.warning(
				new H5PLibraryManagementErrorLoggable(
					error,
					{ library: `${library.machineName}-${library.majorVersion}.${library.minorVersion}` },
					'while reading library metadata'
				)
			);

			return false;
		}
		if (metadata?.preloadedJs) {
			await this.checkFiles(
				library,
				metadata.preloadedJs.map((js) => js.path)
			);
		}
		if (metadata?.preloadedCss) {
			await this.checkFiles(
				library,
				metadata.preloadedCss.map((css) => css.path)
			);
		}

		return true;
	}

	private logLibraryIsNotInstalled(library: ILibraryName): void {
		this.logger.info(
			new H5PLibraryManagementLoggable(
				`Library ${library.machineName}-${library.majorVersion}.${library.minorVersion} is not installed.`
			)
		);
	}

	private async checkFiles(library: ILibraryName, requiredFiles: string[]): Promise<boolean> {
		const missingFiles = (
			await Promise.all(
				requiredFiles.map(async (file) => {
					return {
						path: file,
						status: await this.libraryStorage.fileExists(library, file),
					};
				})
			)
		)
			.filter((file) => !file.status)
			.map((file) => file.path);
		if (missingFiles.length > 0) {
			this.logMissingFiles(library, missingFiles);

			return false;
		}

		return true;
	}

	private logMissingFiles(library: ILibraryName, missingFiles: string[]): void {
		this.logger.info(
			new H5PLibraryManagementLoggable(
				`Missing files for library ${library.machineName}-${library.majorVersion}.${
					library.minorVersion
				}: ${missingFiles.join(', ')}`
			)
		);
	}

	private async synchronizeLibraryToS3(libraryName: ILibraryName): Promise<void> {
		let metadata: IInstalledLibrary | undefined = undefined;
		try {
			metadata = await this.libraryStorage.getLibrary(libraryName);
		} catch (error) {
			this.logger.warning(
				new H5PLibraryManagementErrorLoggable(
					error,
					{ library: `${libraryName.machineName}-${libraryName.majorVersion}.${libraryName.minorVersion}` },
					'while reading library'
				)
			);

			return;
		}

		const dataStream = Readable.from(JSON.stringify(metadata, null, 2));
		const fileAdded = await this.libraryStorage.addFile(libraryName, 'library.json', dataStream);
		if (fileAdded) {
			this.logger.info(
				new H5PLibraryManagementLoggable(
					`Added library.json containing latest metadata for ${metadata.machineName}-${metadata.majorVersion}.${metadata.minorVersion}.${metadata.patchVersion} to S3.`
				)
			);
		}
	}
}
