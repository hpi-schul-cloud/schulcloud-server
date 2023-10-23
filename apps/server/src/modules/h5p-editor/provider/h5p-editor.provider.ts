import { H5PEditor, cacheImplementations } from '@lumieducation/h5p-server';

import { IH5PEditorOptions, ITranslationFunction } from '@lumieducation/h5p-server/build/src/types';
import { h5pConfig, h5pUrlGenerator } from '../service/config/h5p-service-config';
import { ContentStorage } from '../service/contentStorage.service';
import { Translator } from '../service/h5p-translator.service';
import { LibraryStorage } from '../service/libraryStorage.service';
import { TemporaryFileStorage } from '../service/temporary-file-storage.service';

export const H5PEditorProvider = {
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
		const translationFunction: ITranslationFunction = await Translator.translate();
		const h5pEditor = new H5PEditor(
			cache,
			h5pConfig,
			libraryStorage,
			contentStorage,
			temporaryStorage,
			translationFunction,
			h5pUrlGenerator,
			h5pOptions
		);
		h5pEditor.setRenderer((model) => model);

		return h5pEditor;
	},
};
