import { H5PPlayer } from '@lumieducation/h5p-server';

import { ContentStorage } from '../contentStorage/contentStorage';
import { LibraryStorage } from '../libraryStorage/libraryStorage';
import { h5pConfig, h5pUrlGenerator } from './config/h5p-service-config';
import { Translator } from './h5p-translator.service';
import { h5pConfig, h5pUrlGenerator } from './config/h5p-service-config';

export const H5PPlayerService = {
	provide: H5PPlayer,
	inject: [ContentStorage, LibraryStorage],
	useFactory: (contentStorage: ContentStorage, libraryStorage: LibraryStorage) => {
	useFactory: async (contentStorage: ContentStorage, libraryStorage: LibraryStorage) => {
		const h5pPlayer = new H5PPlayer(
			libraryStorage,
			contentStorage,
			h5pConfig,
			undefined,
			h5pUrlGenerator,
			undefined,
			h5pUrlGenerator,
			await Translator.translate(),
			undefined,
			undefined
		);

		h5pPlayer.setRenderer((model) => model);

		return h5pPlayer;
	},
};
