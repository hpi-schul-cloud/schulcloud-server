import { cacheImplementations, H5PPlayer, ITranslationFunction } from '@lumieducation/h5p-server';
import CachedLibraryStorage from '@lumieducation/h5p-server/build/src/implementation/cache/CachedLibraryStorage';
import { Cache } from 'cache-manager';
import { h5pConfig, h5pUrlGenerator } from '../service/config/h5p-service-config';
import { ContentStorage } from '../service/content-storage.service';
import { Translator } from '../service/h5p-translator.service';
import { LibraryStorage } from '../service/library-storage.service';

export const H5PPlayerProvider = {
	provide: H5PPlayer,
	inject: [ContentStorage, LibraryStorage],
	useFactory: async (
		contentStorage: ContentStorage,
		libraryStorage: LibraryStorage,
		cacheAdapter: Cache
	): Promise<H5PPlayer> => {
		const libraryCache = new cacheImplementations.CachedLibraryStorage(
			new CachedLibraryStorage(libraryStorage, cacheAdapter)
		);
		const translationFunction: ITranslationFunction = await Translator.translate();
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
