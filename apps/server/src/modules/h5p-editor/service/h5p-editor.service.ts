import { H5PConfig, H5PEditor, UrlGenerator, cacheImplementations } from '@lumieducation/h5p-server';

import { IH5PEditorOptions } from '@lumieducation/h5p-server/build/src/types';
import { ContentStorage } from '../contentStorage/contentStorage';
import { LibraryStorage } from '../libraryStorage/libraryStorage';
import { Translator } from './h5p-translator.service';
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
			await Translator.translate(),
			urlGenerator,
			h5pOptions
		);

		return h5pEditor;
	},
};
