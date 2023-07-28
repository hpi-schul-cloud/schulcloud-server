import { H5PConfig, H5PPlayer, ITranslationFunction, UrlGenerator } from '@lumieducation/h5p-server';

import i18next from 'i18next';
import i18nextFsBackend from 'i18next-fs-backend';
import path from 'path';
import { LibraryStorage } from '../libraryStorage/libraryStorage';
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

		const pathBackend = path.join(
			__dirname,
			'../../../../../../node_modules/@lumieducation/h5p-server/build/assets/translations/{{ns}}/{{lng}}.json'
		);
		const translationFunction = await i18next.use(i18nextFsBackend).init({
			backend: {
				loadPath: pathBackend,
			},
			ns: [
				'client',
				'copyright-semantics',
				'hub',
				'library-metadata',
				'metadata-semantics',
				'mongo-s3-content-storage',
				's3-temporary-storage',
				'server',
				'storage-file-implementations',
			],
			preload: ['es', 'de', 'en', 'uk'],
		});
		const translate: ITranslationFunction = (key, language) => translationFunction(key, { lng: language });

		const h5pPlayer = new H5PPlayer(
			libraryStorage,
			contentStorage,
			config,
			undefined,
			urlGenerator,
			translate,
			undefined,
			undefined
		);

		return h5pPlayer;
	},
};
