import { H5PPlayer } from '@lumieducation/h5p-server';

import { ContentStorage } from './contentStorage.service';
import { LibraryStorage } from './libraryStorage.service';
import { h5pConfig, h5pUrlGenerator } from './config/h5p-service-config';

export const H5PPlayerService = {
	provide: H5PPlayer,
	inject: [ContentStorage, LibraryStorage],
	useFactory: (contentStorage: ContentStorage, libraryStorage: LibraryStorage) => {
		const h5pPlayer = new H5PPlayer(
			libraryStorage,
			contentStorage,
			h5pConfig,
			undefined,
			h5pUrlGenerator,
			undefined,
			undefined,
			undefined
		);

		h5pPlayer.setRenderer((model) => model);

		return h5pPlayer;
	},
};
