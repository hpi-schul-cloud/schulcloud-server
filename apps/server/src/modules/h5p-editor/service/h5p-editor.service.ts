import { H5PConfig, H5PEditor, UrlGenerator, cacheImplementations, fsImplementations } from '@lumieducation/h5p-server';

import os from 'node:os';
import path from 'node:path';

export const H5PEditorService = {
	provide: H5PEditor,
	useFactory: () => {
		const tmpDir = os.tmpdir();

		const cache = new cacheImplementations.CachedKeyValueStorage('kvcache');

		const libraryStorage = new fsImplementations.FileLibraryStorage(path.join(tmpDir, '/h5p_libraries'));
		const contentStorage = new fsImplementations.FileContentStorage(path.join(tmpDir, '/h5p_content'));
		const temporaryStorage = new fsImplementations.DirectoryTemporaryFileStorage(path.join(tmpDir, '/h5p_temporary'));

		const config: H5PConfig = new H5PConfig(undefined, {
			baseUrl: '/api/v3/h5p-editor',
			contentUserStateSaveInterval: false,
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

		return h5pEditor;
	},
};
