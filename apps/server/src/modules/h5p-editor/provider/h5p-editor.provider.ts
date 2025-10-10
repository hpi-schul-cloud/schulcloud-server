import { cacheImplementations, H5PEditor } from '@lumieducation/h5p-server';
import CachedLibraryStorage from '@lumieducation/h5p-server/build/src/implementation/cache/CachedLibraryStorage';
import { IH5PEditorOptions, ITranslationFunction } from '@lumieducation/h5p-server/build/src/types';
import { Cache } from 'cache-manager';
import { ContentStorage, LibraryStorage, TemporaryFileStorage, Translator } from '../service';
import { h5pConfig, h5pUrlGenerator } from '../service/config/h5p-service-config';
import EditorPermissionSystem from './editor-permission-system';
import { H5P_CACHE_PROVIDER_TOKEN } from './h5p-cache.provider';

export const H5PEditorProvider = {
	provide: H5PEditor,
	inject: [ContentStorage, LibraryStorage, TemporaryFileStorage, H5P_CACHE_PROVIDER_TOKEN],
	async useFactory(
		contentStorage: ContentStorage,
		libraryStorage: LibraryStorage,
		temporaryStorage: TemporaryFileStorage,
		cacheAdapter: Cache,
	): Promise<H5PEditor> {
		const cache = new cacheImplementations.CachedKeyValueStorage('kvcache', cacheAdapter);
		const cachedLibraryStorage = new cacheImplementations.CachedLibraryStorage(
			new CachedLibraryStorage(libraryStorage, cacheAdapter)
		);

		const permissionSystem = new EditorPermissionSystem();
		const h5pOptions: IH5PEditorOptions = {
			enableHubLocalization: true,
			enableLibraryNameLocalization: true,
			permissionSystem,
		};
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		const translationFunction: ITranslationFunction = await Translator.translate();
		const h5pEditor = new H5PEditor(
			cache,
			h5pConfig,
			cachedLibraryStorage,
			contentStorage,
			temporaryStorage,
			translationFunction,
			h5pUrlGenerator,
			h5pOptions
		);
		h5pEditor.setRenderer((model) => model);

		return h5pEditor;
	},
};