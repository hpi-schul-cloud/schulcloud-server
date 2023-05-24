import { H5PConfig, H5PEditor, UrlGenerator, cacheImplementations, fsImplementations } from '@lumieducation/h5p-server';
import { Injectable } from '@nestjs/common';

import os from 'node:os';
import path from 'node:path';

@Injectable()
export class H5PEditorService {
	public readonly h5pEditor: H5PEditor;

	constructor() {
		const tmpDir = os.tmpdir();

		const cache = new cacheImplementations.CachedKeyValueStorage('kvcache');

		const libraryStorage = new fsImplementations.FileLibraryStorage(path.join(tmpDir, '/h5p_libraries'));
		const contentStorage = new fsImplementations.FileContentStorage(path.join(tmpDir, '/h5p_content'));
		const temporaryStorage = new fsImplementations.DirectoryTemporaryFileStorage(path.join(tmpDir, '/h5p_temporary'));

		const config: H5PConfig = new H5PConfig(undefined, {
			baseUrl: '/api/v3/h5p-editor',
		});

		const urlGenerator = new UrlGenerator(config);

		this.h5pEditor = new H5PEditor(
			cache,
			config,
			libraryStorage,
			contentStorage,
			temporaryStorage,
			undefined,
			urlGenerator,
			undefined
		);
	}
}
