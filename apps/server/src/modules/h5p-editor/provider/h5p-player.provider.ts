import { cacheImplementations, H5PPlayer, ITranslationFunction } from '@lumieducation/h5p-server';
import CachedLibraryStorage from '@lumieducation/h5p-server/build/src/implementation/cache/CachedLibraryStorage';
import { Cache } from 'cache-manager';
import { H5P_EDITOR_CONFIG_TOKEN, H5PEditorConfig } from '../h5p-editor.config';
import { h5pConfig, h5pUrlGenerator } from '../service/config/h5p-service-config';
import { ContentStorage } from '../service/content-storage.service';
import { Translator } from '../service/h5p-translator.service';
import { LibraryStorage } from '../service/library-storage.service';
import { H5P_CACHE_PROVIDER_TOKEN } from './h5p-cache.provider';

export const H5PPlayerProvider = {
	provide: H5PPlayer,
	inject: [ContentStorage, LibraryStorage, H5P_CACHE_PROVIDER_TOKEN, H5P_EDITOR_CONFIG_TOKEN],
	useFactory: async (
		contentStorage: ContentStorage,
		libraryStorage: LibraryStorage,
		cacheAdapter: Cache,
		h5pEditorConfig: H5PEditorConfig
	): Promise<H5PPlayer> => {
		const libraryCache = new cacheImplementations.CachedLibraryStorage(
			new CachedLibraryStorage(libraryStorage, cacheAdapter)
		);
		const { availableLanguages } = h5pEditorConfig;

		const translationFunction: ITranslationFunction = await Translator.translate(availableLanguages);
		const h5pPlayer = new H5PPlayer(
			libraryCache,
			contentStorage,
			h5pConfig,
			undefined,
			h5pUrlGenerator,
			translationFunction,
			undefined
		);

		h5pPlayer.setRenderer((model) => model);

		return h5pPlayer;
	},
};
