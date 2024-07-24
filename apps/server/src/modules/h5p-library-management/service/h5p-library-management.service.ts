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
import { IHubContentType } from '@lumieducation/h5p-server/build/src/types';
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContentStorage, LibraryStorage } from '@src/modules/h5p-editor';
import { readFileSync } from 'fs';
import { parse } from 'yaml';
import PermissionSystem from '../permission-system';
import { IH5PLibraryManagementConfig } from './h5p-library-management.config';

const h5pConfig = new H5PConfig(undefined, {
	baseUrl: '/api/v3/h5p-editor',
	contentUserStateSaveInterval: false,
	setFinishedEnabled: false,
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
		private readonly configService: ConfigService<IH5PLibraryManagementConfig, true>
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
		const permissionSystem = new PermissionSystem();
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
	}

	public async uninstallUnwantedLibraries(
		wantedLibraries: string[],
		librariesToCheck: ILibraryAdministrationOverviewItem[]
	): Promise<void> {
		if (librariesToCheck.length === 0) {
			return;
		}
		const lastPositionLibrariesToCheckArray = librariesToCheck.length - 1;
		if (
			!wantedLibraries.includes(librariesToCheck[lastPositionLibrariesToCheckArray].machineName) &&
			librariesToCheck[lastPositionLibrariesToCheckArray].dependentsCount === 0
		) {
			// force removal, don't let content prevent it, therefore use libraryStorage directly
			// also to avoid conflicts, remove one-by-one, not using for-await:
			await this.libraryStorage.deleteLibrary(librariesToCheck[lastPositionLibrariesToCheckArray]);
		}
		await this.uninstallUnwantedLibraries(
			this.libraryWishList,
			librariesToCheck.slice(0, lastPositionLibrariesToCheckArray)
		);
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

	public async installLibraries(librariesToInstall: string[]): Promise<void> {
		if (librariesToInstall.length === 0) {
			return;
		}
		const lastPositionLibrariesToInstallArray = librariesToInstall.length - 1;
		// avoid conflicts, install one-by-one:
		const contentType = await this.contentTypeCache.get(librariesToInstall[lastPositionLibrariesToInstallArray]);
		this.checkContentTypeExists(contentType);

		const user = this.createDefaultIUser();

		await this.contentTypeRepo.installContentType(librariesToInstall[lastPositionLibrariesToInstallArray], user);
		await this.installLibraries(librariesToInstall.slice(0, lastPositionLibrariesToInstallArray));
	}

	public async run(): Promise<void> {
		const installedLibraries = await this.libraryAdministration.getLibraries();
		await this.uninstallUnwantedLibraries(this.libraryWishList, installedLibraries);
		await this.installLibraries(this.libraryWishList);
	}
}
