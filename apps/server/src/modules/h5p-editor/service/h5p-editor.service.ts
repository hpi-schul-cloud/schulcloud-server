import { H5PConfig, H5PEditor, UrlGenerator, cacheImplementations } from '@lumieducation/h5p-server';

import i18next from 'i18next';
import path from 'path';
import { IH5PEditorOptions, ITranslationFunction } from '@lumieducation/h5p-server/build/src/types';
import i18nextFsBackend from 'i18next-fs-backend';
import { ContentStorage } from '../contentStorage/contentStorage';
import { LibraryStorage } from '../libraryStorage/libraryStorage';
import { TemporaryFileStorage } from '../temporary-file-storage/temporary-file-storage';

export const H5PEditorService = {
	provide: H5PEditor,
	inject: [ContentStorage, LibraryStorage, TemporaryFileStorage],
	async useFactory(
		contentStorage: ContentStorage,
		libraryStorage: LibraryStorage,
		temporaryStorage: TemporaryFileStorage
	) {
		const cache = new cacheImplementations.CachedKeyValueStorage('kvcache');

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

		const h5pOptions: IH5PEditorOptions = {
			enableHubLocalization: true,
			enableLibraryNameLocalization: true,
		};

		const h5pEditor = new H5PEditor(
			cache,
			config,
			libraryStorage,
			contentStorage,
			temporaryStorage,
			translate,
			urlGenerator,
			h5pOptions
		);

		return h5pEditor;
	},
};
