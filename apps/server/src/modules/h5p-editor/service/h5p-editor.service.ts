import { H5PEditor, cacheImplementations } from '@lumieducation/h5p-server';

import { ContentStorage } from './contentStorage.service';
import { LibraryStorage } from './libraryStorage.service';
import { TemporaryFileStorage } from './temporary-file-storage.service';
import { IH5PEditorOptions } from '@lumieducation/h5p-server/build/src/types';
import { Translator } from './h5p-translator.service';
import { h5pConfig, h5pUrlGenerator } from './config/h5p-service-config';

export const H5PEditorService = {
	provide: H5PEditor,
	inject: [ContentStorage, LibraryStorage, TemporaryFileStorage],
	async useFactory(
		contentStorage: ContentStorage,
		libraryStorage: LibraryStorage,
		temporaryStorage: TemporaryFileStorage
	) {
		const cache = new cacheImplementations.CachedKeyValueStorage('kvcache');

		const h5pOptions: IH5PEditorOptions = {
			enableHubLocalization: true,
			enableLibraryNameLocalization: true,
		};

		const h5pEditor = new H5PEditor(
			cache,
			h5pConfig,
			libraryStorage,
			contentStorage,
			temporaryStorage,
			await Translator.translate(),
			h5pUrlGenerator,
			h5pOptions
		);
		h5pEditor.setRenderer((model) => model);

		return h5pEditor;
	},
};
