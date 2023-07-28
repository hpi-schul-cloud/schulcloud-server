import { H5PConfig, H5PEditor, UrlGenerator, cacheImplementations } from '@lumieducation/h5p-server';

import { ContentStorage } from '../contentStorage/contentStorage';
import { LibraryStorage } from '../libraryStorage/libraryStorage';
import { TemporaryFileStorage } from '../temporary-file-storage/temporary-file-storage';

export const H5PEditorService = {
	provide: H5PEditor,
	inject: [ContentStorage, LibraryStorage, TemporaryFileStorage],
	useFactory(contentStorage: ContentStorage, libraryStorage: LibraryStorage, temporaryStorage: TemporaryFileStorage) {
		const cache = new cacheImplementations.CachedKeyValueStorage('kvcache');

		const config: H5PConfig = new H5PConfig(undefined, {
			baseUrl: '/api/v3/h5p-editor',
			contentUserStateSaveInterval: false,
			contentHubEnabled: false,
		});

		const urlGenerator = new UrlGenerator(config);

		const h5pEditor = new H5PEditor(
			cache,
			config,
			libraryStorage,
			contentStorage,
			temporaryStorage,
			undefined,
			urlGenerator,
			undefined
		);

		h5pEditor.setRenderer((model) => model);

		return h5pEditor;
	},
};
