import { H5PConfig, H5PPlayer, UrlGenerator } from '@lumieducation/h5p-server';

import { ContentStorage } from '../contentStorage/contentStorage';
import { LibraryStorage } from '../libraryStorage/libraryStorage';

export const H5PPlayerService = {
	provide: H5PPlayer,
	inject: [ContentStorage, LibraryStorage],
	useFactory: (contentStorage: ContentStorage, libraryStorage: LibraryStorage) => {
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
			undefined,
			undefined,
			undefined
		);

		return h5pPlayer;
	},
};
