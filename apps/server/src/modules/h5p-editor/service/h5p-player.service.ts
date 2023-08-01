import { H5PPlayer } from '@lumieducation/h5p-server';

import { ContentStorage } from '../contentStorage/contentStorage';
import { LibraryStorage } from '../libraryStorage/libraryStorage';
import { h5pConfig, h5pUrlGenerator } from './config/h5p-service-config';
import { Translator } from './h5p-translator.service';
import { ContentStorage } from '../contentStorage/contentStorage';

export const H5PPlayerService = {
	provide: H5PPlayer,
	inject: [ContentStorage, LibraryStorage],
	useFactory: async (contentStorage: ContentStorage, libraryStorage: LibraryStorage) => {
		const config: H5PConfig = new H5PConfig(undefined, {
			baseUrl: '/api/v3/h5p-editor',
			contentUserStateSaveInterval: false,
		});

		const urlGenerator = new UrlGenerator(config);

	useFactory: (contentStorage: ContentStorage, libraryStorage: LibraryStorage) => {
		const h5pPlayer = new H5PPlayer(
			libraryStorage,
			contentStorage,
			h5pConfig,
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
