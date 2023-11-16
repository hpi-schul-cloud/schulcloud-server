/* eslint-disable no-console */
import {
	H5PConfig,
	cacheImplementations,
	LibraryManager,
	ContentTypeCache,
	IUser,
	LibraryAdministration,
} from '@lumieducation/h5p-server';
import ContentManager from '@lumieducation/h5p-server/build/src/ContentManager';
import ContentTypeInformationRepository from '@lumieducation/h5p-server/build/src/ContentTypeInformationRepository';
import { Injectable } from '@nestjs/common';
import { ContentStorage, LibraryStorage } from '@src/modules/h5p-editor';
import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { ConfigService } from '@nestjs/config';
import { H5pLibraryManagementConfig } from '../h5p-library-management.config';

const h5pConfig = new H5PConfig(undefined, {
	baseUrl: '/api/v3/h5p-editor',
	contentUserStateSaveInterval: false,
	setFinishedEnabled: false,
});

@Injectable()
export class H5PLibraryManagementService {
	contentTypeCache: ContentTypeCache;

	contentTypeRepo: ContentTypeInformationRepository;

	libraryManager: LibraryManager;

	libraryAdministration: LibraryAdministration;

	libraryWishList: string[];

	libraryListPath: string;

	constructor(
		private readonly libraryStorage: LibraryStorage,
		private readonly contentStorage: ContentStorage,
		private configService: ConfigService
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
		this.contentTypeRepo = new ContentTypeInformationRepository(this.contentTypeCache, this.libraryManager, h5pConfig);
		const contentManager = new ContentManager(this.contentStorage);
		this.libraryAdministration = new LibraryAdministration(this.libraryManager, contentManager);
		const config = this.configService.get<H5pLibraryManagementConfig>(
			'H5P_EDITOR__LIBRARY_LIST_PATH'
		) as H5pLibraryManagementConfig;
		this.libraryListPath = config.libraryListPath;

		const librariesYamlContent = readFileSync(this.libraryListPath, {
			encoding: 'utf-8',
		});
		this.libraryWishList = (parse(librariesYamlContent) as { h5p_libraries: string[] }).h5p_libraries;
	}

	async uninstallUnwantedLibraries(wantedLibraries: string[]): Promise<void> {
		const installedLibraries = await this.libraryAdministration.getLibraries();
		for (const installedLibrary of installedLibraries) {
			if (!wantedLibraries.includes(installedLibrary.machineName) && installedLibrary.dependentsCount === 0) {
				// force removal, don't let content prevent it, therefore use libraryStorage directly
				// also to avoid conflicts, remove one-by-one, not using for-await:
				// eslint-disable-next-line no-await-in-loop
				await this.libraryStorage.deleteLibrary(installedLibrary);
			}
		}
	}

	async installLibraries(libraries: string[]): Promise<void> {
		for (const libname of libraries) {
			// avoid conflicts, install one-by-one:
			// eslint-disable-next-line no-await-in-loop
			const contentType = await this.contentTypeCache.get(libname);
			if (contentType === undefined) {
				throw new Error('this library does not exist');
			}
			const user: IUser = { canUpdateAndInstallLibraries: true } as IUser;
			// eslint-disable-next-line no-await-in-loop
			await this.contentTypeRepo.installContentType(libname, user);
		}
	}

	async run(): Promise<void> {
		await this.uninstallUnwantedLibraries(this.libraryWishList);
		await this.installLibraries(this.libraryWishList);
	}
}
