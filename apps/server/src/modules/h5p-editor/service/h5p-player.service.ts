import { H5PPlayer, ITranslationFunction } from '@lumieducation/h5p-server';

import { h5pConfig, h5pUrlGenerator } from './config/h5p-service-config';
import { ContentStorage } from './contentStorage.service';
import { Translator } from './h5p-translator.service';
import { LibraryStorage } from './libraryStorage.service';

export const H5PPlayerService = {
	provide: H5PPlayer,
	inject: [ContentStorage, LibraryStorage],
	useFactory: async (contentStorage: ContentStorage, libraryStorage: LibraryStorage) => {
		const translationFunction: ITranslationFunction = await Translator.translate();
		const h5pPlayer = new H5PPlayer(
			libraryStorage,
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
