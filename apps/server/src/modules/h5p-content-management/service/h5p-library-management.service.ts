import { Logger } from '@core/logger';
import {
	cacheImplementations,
	ContentTypeCache,
	H5PConfig,
	H5pError,
	ILibraryAdministrationOverviewItem,
	LibraryAdministration,
	LibraryManager,
	LibraryName,
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
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { TypeGuard } from '@shared/common/guards';
import { readFileSync } from 'fs';
import { Readable } from 'stream';
import { parse } from 'yaml';
import { H5pDefaultUserFactory } from '../factory';
import { H5P_EDITOR_CONFIG_TOKEN, H5PEditorConfig } from '../h5p-editor.config';
import { H5pConsistencyError, H5pTimeoutError } from '../interface';
import {
	H5PLibraryManagementErrorLoggable,
	H5PLibraryManagementInstallResultsLoggable,
	H5PLibraryManagementLoggable,
	H5PLibraryManagementMetricsLoggable,
} from '../loggable';
import { ContentStorage } from './content-storage.service';
import LibraryManagementPermissionSystem from './library-management-permission-system';
import { LibraryStorage } from './library-storage.service';

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
		@Inject(H5P_EDITOR_CONFIG_TOKEN) private readonly config: H5PEditorConfig,
		private readonly logger: Logger
	) {
		const { installLibraryLockMaxOccupationTime } = this.config;
		const h5pConfig = new H5PConfig(undefined, {
			baseUrl: '/api/v3/h5p-editor',
			contentUserStateSaveInterval: false,
			setFinishedEnabled: false,
			installLibraryLockMaxOccupationTime,
		});
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
		const { libraryListPath } = this.config;

		const librariesYamlContent = readFileSync(libraryListPath, { encoding: 'utf-8' });
		const librariesContentType = castToLibrariesContentType(parse(librariesYamlContent));
		this.libraryWishList = librariesContentType.h5p_libraries;

		this.logger.setContext(H5PLibraryManagementService.name);
	}

	public async run(): Promise<void> {
		try {
			this.logStartH5pLibraryManagementJob();

			const availableLibraries = await this.libraryAdministration.getLibraries();
			const uninstalledLibraries = await this.uninstallUnwantedLibrariesAsBulk();
			const installedLibraries = await this.installLibrariesAsBulk(availableLibraries);
			const synchronizedLibraries = await this.synchronizeDbEntryAndLibraryJson();
			const brokenLibraries = await this.checkAndRemoveBrokenLibraries();

			this.logFinishH5pLibraryManagementJob(
				availableLibraries,
				uninstalledLibraries,
				installedLibraries,
				synchronizedLibraries,
				brokenLibraries
			);
		} catch (error: unknown) {
			this.logger.warning(new H5PLibraryManagementErrorLoggable(error, {}, 'during run script'));

			if (this.isS3ClientError(error)) {
				this.logger.warning(new H5PLibraryManagementLoggable('S3Client error detected. Shutting down process.'));
				throw error;
			}
		}
	}

	private logStartH5pLibraryManagementJob(): void {
		this.logger.info(new H5PLibraryManagementLoggable('Starting H5P library management job...'));
	}

	private logFinishH5pLibraryManagementJob(
		availableLibraries: ILibraryAdministrationOverviewItem[],
		uninstalledLibraries: ILibraryAdministrationOverviewItem[],
		installedLibraries: ILibraryInstallResult[],
		synchronizedLibraries: ILibraryInstallResult[],
		brokenLibraries: ILibraryAdministrationOverviewItem[]
	): void {
		this.logger.info(new H5PLibraryManagementLoggable('Finished H5P library management job!'));
		this.logger.info(
			new H5PLibraryManagementMetricsLoggable(
				availableLibraries,
				uninstalledLibraries,
				installedLibraries,
				synchronizedLibraries,
				brokenLibraries
			)
		);
	}

	public async uninstallUnwantedLibrariesAsBulk(): Promise<ILibraryAdministrationOverviewItem[]> {
		const allUninstalledLibraries: ILibraryAdministrationOverviewItem[] = [];
		const allFailedLibraries: ILibraryAdministrationOverviewItem[] = [];

		do {
			const availableLibraries = await this.libraryAdministration.getLibraries();
			const filteredLibraries = this.excludeFailedLibraries(availableLibraries, allFailedLibraries);
			const { uninstalledLibraries, failedLibraries } = await this.uninstallUnwantedLibraries(filteredLibraries);

			allUninstalledLibraries.push(...uninstalledLibraries);
			allFailedLibraries.push(...failedLibraries);

			if (uninstalledLibraries.length === 0) break;
		} while (true);

		return allUninstalledLibraries;
	}

	private excludeFailedLibraries(
		availableLibraries: ILibraryAdministrationOverviewItem[],
		failedLibraries: ILibraryAdministrationOverviewItem[]
	): ILibraryAdministrationOverviewItem[] {
		if (failedLibraries.length > 0) {
			const failedLibrariesSet = new Set(failedLibraries.map((lib) => lib.machineName));
			const filteredLibraries = availableLibraries.filter((lib) => !failedLibrariesSet.has(lib.machineName));

			return filteredLibraries;
		}

		return availableLibraries;
	}

	public async uninstallUnwantedLibraries(availableLibraries: ILibraryAdministrationOverviewItem[]): Promise<{
		uninstalledLibraries: ILibraryAdministrationOverviewItem[];
		failedLibraries: ILibraryAdministrationOverviewItem[];
	}> {
		const unwantedLibraries = this.getUnwantedLibraries(availableLibraries);
		const uninstalledLibraries: ILibraryAdministrationOverviewItem[] = [];
		const failedLibraries: ILibraryAdministrationOverviewItem[] = [];

		// to avoid conflicts or race conditions with the S3, we remove the libraries
		// one-by-one and don't use Promise.allSettled()
		for (const library of unwantedLibraries) {
			try {
				await this.forceUninstallLibrary(library);
				uninstalledLibraries.push(library);
			} catch (error: unknown) {
				failedLibraries.push(library);

				if (this.isS3ClientError(error)) {
					throw error;
				}
			}
		}
		const result = { uninstalledLibraries, failedLibraries };

		return result;
	}

	private getUnwantedLibraries(
		availableLibraries: ILibraryAdministrationOverviewItem[]
	): ILibraryAdministrationOverviewItem[] {
		const unwantedLibraries = availableLibraries
			.filter((lib) => {
				const isLibraryInWishList = this.libraryWishList.includes(lib.machineName);
				const isNeededByOtherLibrary = lib.dependentsCount === 0;

				return !isLibraryInWishList && isNeededByOtherLibrary;
			})
			.map((lib) => {
				return { ...lib };
			});

		return unwantedLibraries;
	}

	private async forceUninstallLibrary(unwantedLibrary: ILibraryAdministrationOverviewItem): Promise<void> {
		this.logStartForceUninstallLibrary(unwantedLibrary.machineName);

		await this.libraryStorage.deleteLibrary(unwantedLibrary);

		this.logFinishedForceUninstallLibrary(unwantedLibrary.machineName);
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
		const availableVersions = availableLibraries.map((lib) => this.formatLibraryVersion(lib));

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

		try {
			const h5pDefaultUser = H5pDefaultUserFactory.create();
			const installResults = await this.contentTypeRepo.installContentType(library, h5pDefaultUser);
			this.logFinishedInstallationOfCurrentVersionFromH5pHub(library, installResults);

			return installResults;
		} catch (error: unknown) {
			this.logger.warning(new H5PLibraryManagementErrorLoggable(error, { library }));

			if (this.isH5pTimeoutError(error) && TypeGuard.isString(error.replacements.ubername)) {
				this.logTimeOutError(error.replacements.ubername);
				const libraryName = LibraryName.fromUberName(error.replacements.ubername);
				await this.libraryStorage.deleteLibrary(libraryName);
			}

			if (this.isH5pConsistencyError(error) && TypeGuard.isString(error.replacements.name)) {
				this.logConsistencyError(error.replacements.name);
				const libraryName = LibraryName.fromUberName(error.replacements.name);
				await this.libraryStorage.deleteLibrary(libraryName);
			}

			return [];
		}
	}

	private isH5pTimeoutError(error: unknown): error is H5pTimeoutError {
		const result =
			error instanceof H5pError &&
			(error.errorId === 'server:install-library-lock-max-time-exceeded' ||
				error.errorId === 'server:install-library-lock-timeout');

		return result;
	}

	private logTimeOutError(library: string): void {
		this.logger.warning(
			new H5PLibraryManagementLoggable(
				`There was a timeout error when installing library ${library}. Reverting installation.`
			)
		);
	}

	private isH5pConsistencyError(error: unknown): error is H5pConsistencyError {
		const result =
			error instanceof H5pError &&
			(error.errorId === 'library-consistency-check-not-installed' ||
				error.errorId === 'library-consistency-check-library-json-unreadable' ||
				error.errorId === 'library-consistency-check-file-missing');

		return result;
	}

	private logConsistencyError(library: string): void {
		this.logger.warning(
			new H5PLibraryManagementLoggable(
				`There was a consistency error when installing library ${library}. Reverting installation.`
			)
		);
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
			.filter((result) => this.isLibraryInstalledOrUpdated(result))
			.map((result) => this.formatLibraryVersion(result.newVersion));

		availableVersions.push(...newVersions);
	}

	private isLibraryInstalledOrUpdated(installResult: ILibraryInstallResult): boolean {
		const isLibraryInstalled = installResult.type === 'new';
		const isLibraryUpdated = installResult.type === 'patch';
		const result = isLibraryInstalled || isLibraryUpdated;

		return result;
	}

	private formatLibraryVersion(version?: IFullLibraryName): string {
		if (!version) return '';

		return `${version.machineName}-${version.majorVersion}.${version.minorVersion}.${version.patchVersion}`;
	}

	public async synchronizeDbEntryAndLibraryJson(): Promise<ILibraryInstallResult[]> {
		const installResults: ILibraryInstallResult[] = [];
		const folders = await this.libraryStorage.getAllLibraryFolders();

		for (const folder of folders) {
			const libraryName = LibraryName.fromUberName(folder);
			const libraryJsonExistsInS3 = await this.libraryStorage.fileExists(libraryName, 'library.json');

			if (libraryJsonExistsInS3) {
				const result = await this.synchronizeLibraryMetadataInDatabase(libraryName);
				installResults.push(result);
			} else {
				await this.addLibraryJsonToS3(libraryName);
			}
		}

		const synchronizedResults = installResults.filter((result) => this.isLibraryInstalledOrUpdated(result));

		return synchronizedResults;
	}

	private async synchronizeLibraryMetadataInDatabase(libraryName: ILibraryName): Promise<ILibraryInstallResult> {
		const parsedJson: ILibraryMetadata = (await this.libraryStorage.getFileAsJson(
			libraryName,
			'library.json',
			true
		)) as ILibraryMetadata;
		const filteredJson = this.filterLibraryMetadata(parsedJson);
		const newLibraryMetadata = this.checkIsLibraryMetadata(filteredJson);

		const newVersionOfLibrary: IFullLibraryName = {
			machineName: newLibraryMetadata.machineName,
			majorVersion: newLibraryMetadata.majorVersion,
			minorVersion: newLibraryMetadata.minorVersion,
			patchVersion: newLibraryMetadata.patchVersion,
		};

		const libraryIsInstalled = await this.libraryStorage.isInstalled(libraryName);
		if (!libraryIsInstalled) {
			const result = await this.addLibrary(newLibraryMetadata, newVersionOfLibrary);

			return result;
		}

		const oldVersionOfLibrary = await this.libraryManager.isPatchedLibrary(newLibraryMetadata);
		if (oldVersionOfLibrary) {
			const result = await this.updateLibrary(newLibraryMetadata, oldVersionOfLibrary, newVersionOfLibrary);

			return result;
		}

		this.logLibraryAlreadyInstalled(newVersionOfLibrary);
		return { type: 'none' };
	}

	private filterLibraryMetadata(obj: Record<string, any>): ILibraryMetadata {
		const allowedKeys: (keyof ILibraryMetadata)[] = [
			'machineName',
			'majorVersion',
			'minorVersion',
			'patchVersion',
			'addTo',
			'author',
			'coreApi',
			'description',
			'dropLibraryCss',
			'dynamicDependencies',
			'editorDependencies',
			'embedTypes',
			'fullscreen',
			'h',
			'license',
			'metadataSettings',
			'preloadedCss',
			'preloadedDependencies',
			'preloadedJs',
			'runnable',
			'title',
			'w',
			'requiredExtensions',
			'state',
		];

		const filteredObject = this.filterObjectByInterface<ILibraryMetadata>(obj, allowedKeys);

		return filteredObject as ILibraryMetadata;
	}
	private checkIsLibraryMetadata(obj: unknown): ILibraryMetadata {
		const definedObject = TypeGuard.checkDefinedObject(obj);
		const objectWithDefinedKeys = TypeGuard.checkKeysInObject(definedObject, [
			'machineName',
			'majorVersion',
			'minorVersion',
			'patchVersion',
			'runnable',
			'title',
		]);
		const machineName = TypeGuard.checkString(objectWithDefinedKeys.machineName);
		const majorVersion = TypeGuard.checkNumber(objectWithDefinedKeys.majorVersion);
		const minorVersion = TypeGuard.checkNumber(objectWithDefinedKeys.minorVersion);
		const patchVersion = TypeGuard.checkNumber(objectWithDefinedKeys.patchVersion);
		let runnable: boolean | 0 | 1;
		if (typeof objectWithDefinedKeys.runnable === 'boolean') {
			({ runnable } = objectWithDefinedKeys);
		} else if (objectWithDefinedKeys.runnable === 0) {
			runnable = 0;
		} else if (objectWithDefinedKeys.runnable === 1) {
			runnable = 1;
		} else {
			throw new Error('runnable must be boolean, 0, or 1');
		}
		const title = TypeGuard.checkString(objectWithDefinedKeys.title);

		const result: ILibraryMetadata = {
			...definedObject,
			machineName,
			majorVersion,
			minorVersion,
			patchVersion,
			runnable,
			title,
		};

		return result;
	}

	private async updateLibrary(
		newLibraryMetadata: ILibraryMetadata,
		oldVersion: IFullLibraryName,
		newVersion: IFullLibraryName
	): Promise<ILibraryInstallResult> {
		try {
			await this.libraryStorage.updateLibrary(newLibraryMetadata);
			await this.checkConsistency(newLibraryMetadata);

			this.logLibraryUpdated(oldVersion, newVersion);

			return {
				type: 'patch',
				oldVersion,
				newVersion,
			};
		} catch (error: unknown) {
			this.logger.warning(
				new H5PLibraryManagementErrorLoggable(
					error,
					{ library: newLibraryMetadata.machineName },
					'during library update'
				)
			);

			if (this.isS3ClientError(error)) {
				throw error;
			}

			this.logRemoveLibraryDueToError(newLibraryMetadata);
			await this.libraryStorage.deleteLibrary(newLibraryMetadata);

			return { type: 'none' };
		}
	}

	private logRemoveLibraryDueToError(library: ILibraryMetadata): void {
		this.logger.warning(
			new H5PLibraryManagementLoggable(`Removing library ${LibraryName.toUberName(library)} due to error.`)
		);
	}

	private logLibraryUpdated(oldVersion: IFullLibraryName, newVersion: IFullLibraryName): void {
		this.logger.info(
			new H5PLibraryManagementLoggable(
				`Updated library: ${LibraryName.toUberName(oldVersion)} to ${LibraryName.toUberName(newVersion)}`
			)
		);
	}

	private logLibraryAlreadyInstalled(newVersion: IFullLibraryName): void {
		this.logger.info(
			new H5PLibraryManagementLoggable(`Library ${LibraryName.toUberName(newVersion)} is already installed.`)
		);
	}

	private async addLibrary(
		newLibraryMetadata: ILibraryMetadata,
		newVersion: IFullLibraryName
	): Promise<ILibraryInstallResult> {
		try {
			await this.libraryStorage.addLibrary(newLibraryMetadata, false);
			await this.checkConsistency(newLibraryMetadata);

			this.logLibraryAdded(newVersion);

			return {
				type: 'new',
				newVersion,
			};
		} catch (error: unknown) {
			this.logger.warning(
				new H5PLibraryManagementErrorLoggable(
					error,
					{ library: newLibraryMetadata.machineName },
					'during library installation'
				)
			);

			if (this.isS3ClientError(error)) {
				throw error;
			}

			return { type: 'none' };
		}
	}

	private logLibraryAdded(newVersion: IFullLibraryName): void {
		this.logger.info(new H5PLibraryManagementLoggable(`Added library: ${this.formatLibraryVersion(newVersion)}`));
	}

	private async checkConsistency(library: ILibraryName): Promise<void> {
		const isLibraryInstalled = await this.libraryStorage.isInstalled(library);
		if (!isLibraryInstalled) {
			this.logLibraryIsNotInstalled(library);
			this.throwConsistencyError('Library is not installed');
		}

		let metadata: IInstalledLibrary;
		try {
			metadata = await this.libraryStorage.getLibrary(library);
		} catch (error: unknown) {
			this.logMetadataMissing(error, library);
			this.throwConsistencyError('Could not read library metadata');
		}

		const jsIsMissing = await this.jsIsMissing(metadata);
		if (jsIsMissing) this.throwConsistencyError('Missing JS files');

		const cssIsMissing = await this.cssIsMissing(metadata);
		if (cssIsMissing) this.throwConsistencyError('Missing CSS files');
	}

	private async jsIsMissing(metadata: IInstalledLibrary): Promise<boolean> {
		const jsPaths = this.getJsPaths(metadata);
		const filesExist = await this.checkFiles(metadata, jsPaths);
		const jsIsMissing = !!metadata?.preloadedJs && !filesExist;

		return jsIsMissing;
	}

	private async cssIsMissing(metadata: IInstalledLibrary): Promise<boolean> {
		const cssPaths = this.getCssPaths(metadata);
		const filesExist = await this.checkFiles(metadata, cssPaths);
		const cssIsMissing = !!metadata?.preloadedCss && !filesExist;

		return cssIsMissing;
	}

	private getCssPaths(metadata: IInstalledLibrary): string[] {
		return metadata?.preloadedCss?.map((css) => css.path) || [];
	}

	private getJsPaths(metadata: IInstalledLibrary): string[] {
		return metadata?.preloadedJs?.map((js) => js.path) || [];
	}

	private logMetadataMissing(error: unknown, library: ILibraryName): void {
		this.logger.warning(
			new H5PLibraryManagementErrorLoggable(
				error,
				{ library: LibraryName.toUberName(library) },
				'while reading library metadata'
			)
		);
	}

	private throwConsistencyError(message: string): never {
		throw new Error(message);
	}

	private logLibraryIsNotInstalled(library: ILibraryName): void {
		this.logger.info(new H5PLibraryManagementLoggable(`Library ${LibraryName.toUberName(library)} is not installed.`));
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
				`Missing files for library ${LibraryName.toUberName(library)}: ${missingFiles.join(', ')}`
			)
		);
	}

	private async addLibraryJsonToS3(libraryName: ILibraryName): Promise<void> {
		let metadata: IInstalledLibrary | undefined = undefined;
		try {
			metadata = await this.libraryStorage.getLibrary(libraryName);
		} catch (error: unknown) {
			if (this.isLibraryNotFoundError(error)) {
				this.logRemovalOfLostLibrary(libraryName);
				// If the folder exists without a library.json in S3 and we don't have
				// a metadata entry stored in the database, we remove the folder, as we
				// cannot determine the correct state of the library.
				await this.libraryStorage.deleteFolder(libraryName);
			} else {
				this.logger.warning(
					new H5PLibraryManagementErrorLoggable(
						error,
						{ library: LibraryName.toUberName(libraryName) },
						'while reading library'
					)
				);

				if (this.isS3ClientError(error)) {
					throw error;
				}
			}

			return;
		}

		let fileAdded = false;
		const filteredMetadata = this.filterInstalledLibrary(metadata);
		const dataStream = Readable.from(JSON.stringify(filteredMetadata, null, 2));
		fileAdded = await this.libraryStorage.addFile(libraryName, 'library.json', dataStream);
		if (fileAdded) {
			this.logLibraryJsonAddedToS3(metadata);
		}
	}

	private isLibraryNotFoundError(error: unknown): boolean {
		const result =
			error instanceof Error && !!error.message && error.message.toLowerCase().includes('library not found');

		return result;
	}

	private logRemovalOfLostLibrary(library: ILibraryName): void {
		this.logger.warning(
			new H5PLibraryManagementLoggable(
				`Removing "lost" library ${LibraryName.toUberName(
					library
				)} from S3 as there is no metadata in the database as well as no library.json in S3.`
			)
		);
	}

	private filterInstalledLibrary(obj: Record<string, any>): IInstalledLibrary {
		const allowedKeys: (keyof IInstalledLibrary)[] = [
			'machineName',
			'majorVersion',
			'minorVersion',
			'patchVersion',
			'addTo',
			'author',
			'coreApi',
			'description',
			'dropLibraryCss',
			'dynamicDependencies',
			'editorDependencies',
			'embedTypes',
			'fullscreen',
			'h',
			'license',
			'metadataSettings',
			'preloadedCss',
			'preloadedDependencies',
			'preloadedJs',
			'runnable',
			'title',
			'w',
			'requiredExtensions',
			'state',
			'restricted',
			'compare',
			'compareVersions',
		];

		const filteredObject = this.filterObjectByInterface<IInstalledLibrary>(obj, allowedKeys);

		return filteredObject as IInstalledLibrary;
	}

	private logLibraryJsonAddedToS3(metadata: IInstalledLibrary): void {
		this.logger.info(
			new H5PLibraryManagementLoggable(
				`Added library.json containing latest metadata for ${this.formatLibraryVersion(metadata)} to S3.`
			)
		);
	}

	public async checkAndRemoveBrokenLibraries(): Promise<ILibraryAdministrationOverviewItem[]> {
		const brokenLibraries: ILibraryAdministrationOverviewItem[] = [];
		const availableLibraries = await this.libraryAdministration.getLibraries();

		for (const library of availableLibraries) {
			const libraryName: ILibraryName = {
				machineName: library.machineName,
				majorVersion: library.majorVersion,
				minorVersion: library.minorVersion,
			};
			try {
				await this.checkConsistency(libraryName);
			} catch (error: unknown) {
				this.logger.warning(
					new H5PLibraryManagementErrorLoggable(
						error,
						{ library: LibraryName.toUberName(library) },
						'during consistency check'
					)
				);

				if (this.isS3ClientError(error)) {
					throw error;
				}

				this.logRemovalOfBrokenLibrary(libraryName);
				await this.libraryStorage.deleteLibrary(libraryName);
				brokenLibraries.push(library);
			}
		}

		return brokenLibraries;
	}

	private logRemovalOfBrokenLibrary(library: ILibraryName): void {
		this.logger.warning(
			new H5PLibraryManagementLoggable(
				`Removing "broken" library ${LibraryName.toUberName(
					library
				)} from database and S3 as the library did not pass consistency check.`
			)
		);
	}

	private isS3ClientError(error: unknown): boolean {
		if (error instanceof Error && error.message) {
			return error.message.includes('S3ClientAdapter') || error.message.includes('S3Client');
		}
		return false;
	}

	private filterObjectByInterface<T>(obj: Record<string, any>, allowedKeys: (keyof T)[]): Partial<T> {
		const result: Partial<T> = {};
		for (const key of allowedKeys) {
			if (key in obj) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				result[key] = obj[key as string];
			}
		}
		return result;
	}
}
