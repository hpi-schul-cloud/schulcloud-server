import {
	H5PConfig,
	cacheImplementations,
	LibraryManager,
	ContentTypeCache,
	IUser,
	LibraryAdministration,
	ILibraryAdministrationOverviewItem,
} from '@lumieducation/h5p-server';
import ContentManager from '@lumieducation/h5p-server/build/src/ContentManager';
import ContentTypeInformationRepository from '@lumieducation/h5p-server/build/src/ContentTypeInformationRepository';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentStorage, LibraryStorage } from '@src/modules/h5p-editor/service';
import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { ConfigService } from '@nestjs/config';
import { IH5PLibraryManagementConfig } from './h5p-library-management.config';

const h5pConfig = new H5PConfig(undefined, {
	baseUrl: '/api/v3/h5p-editor',
	contentUserStateSaveInterval: false,
	setFinishedEnabled: false,
});

interface LibrariesContentType {
	h5p_libraries: string[];
}

function isLibrariesContentType(object: any): object is LibrariesContentType {
	return 'h5p_libraries' in object;
}

function isUserType(object: any): object is IUser {
	return true;
}

@Injectable()
export class H5PLibraryManagementService {
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
		this.contentTypeRepo = new ContentTypeInformationRepository(this.contentTypeCache, this.libraryManager, h5pConfig);
		const contentManager = new ContentManager(this.contentStorage);
		this.libraryAdministration = new LibraryAdministration(this.libraryManager, contentManager);
		const filePath = this.configService.get<string>('H5P_EDITOR__LIBRARY_LIST_PATH');
		const librariesYamlContent = readFileSync(filePath, { encoding: 'utf-8' });
		if (isLibrariesContentType(parse(librariesYamlContent))) {
			this.libraryWishList = (parse(librariesYamlContent) as LibrariesContentType).h5p_libraries;
		} 
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

	public async installLibraries(librariesToInstall: string[]): Promise<void> {
		if (librariesToInstall.length === 0) {
			return;
		}
		const lastPositionLibrariesToInstallArray = librariesToInstall.length - 1;
		// avoid conflicts, install one-by-one:
		const contentType = await this.contentTypeCache.get(librariesToInstall[lastPositionLibrariesToInstallArray]);
		if (contentType === undefined) {
			throw new NotFoundException('this library does not exist');
		}
		const userObj = {
			canCreateRestricted: true,
			canInstallRecommended: true,
			canUpdateAndInstallLibraries: true,
			email: 'a@b.de',
			id: 'a',
			name: 'a',
			type: 'local',
		};
		if (isUserType(userObj)) {
			const user: IUser = userObj;
			await this.contentTypeRepo.installContentType(librariesToInstall[lastPositionLibrariesToInstallArray], user);
			await this.installLibraries(librariesToInstall.slice(0, lastPositionLibrariesToInstallArray));
		}
	}

	public async run(): Promise<void> {
		const installedLibraries = await this.libraryAdministration.getLibraries();
		await this.uninstallUnwantedLibraries(this.libraryWishList, installedLibraries);
		await this.installLibraries(this.libraryWishList);
	}
}
