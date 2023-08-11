import { H5PEditor, cacheImplementations } from '@lumieducation/h5p-server';

import { ContentStorage } from './contentStorage.service';
import { LibraryStorage } from './libraryStorage.service';
import { TemporaryFileStorage } from './temporary-file-storage.service';
import { h5pConfig, h5pUrlGenerator } from './config/h5p-service-config';

export const H5PEditorService = {
	provide: H5PEditor,
	inject: [ContentStorage, LibraryStorage, TemporaryFileStorage],
	useFactory(contentStorage: ContentStorage, libraryStorage: LibraryStorage, temporaryStorage: TemporaryFileStorage) {
		const cache = new cacheImplementations.CachedKeyValueStorage('kvcache');

		const h5pEditor = new H5PEditor(
			cache,
			h5pConfig,
			libraryStorage,
			contentStorage,
			temporaryStorage,
			undefined,
			h5pUrlGenerator,
			undefined
		);

		h5pEditor.setRenderer((model) => model);

		return h5pEditor;
	},
};
