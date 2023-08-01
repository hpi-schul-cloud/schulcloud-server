import { H5PConfig, H5PPlayer, UrlGenerator } from '@lumieducation/h5p-server';

import { LibraryStorage } from '../libraryStorage/libraryStorage';
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

		const h5pPlayer = new H5PPlayer(
			libraryStorage,
			contentStorage,
			config,
			undefined,
			urlGenerator,
			await Translator.translate(),
			undefined,
			undefined
		);

		return h5pPlayer;
	},
};
