import { H5PConfig, H5PPlayer, UrlGenerator, fsImplementations } from '@lumieducation/h5p-server';

import os from 'node:os';
import path from 'node:path';

export const H5PPlayerService = {
	provide: H5PPlayer,
	useFactory: () => {
		const tmpDir = os.tmpdir();

		const libraryStorage = new fsImplementations.FileLibraryStorage(path.join(tmpDir, '/h5p_libraries'));
		const contentStorage = new fsImplementations.FileContentStorage(path.join(tmpDir, '/h5p_content'));

		const config: H5PConfig = new H5PConfig(undefined, {
			baseUrl: '/api/v3/h5p-editor',
			contentUserStateSaveInterval: false,
		});

		const urlGenerator = new UrlGenerator(config);

		const h5pPlayer = new H5PPlayer(
			libraryStorage,
			contentStorage,
			config,
			undefined,
			urlGenerator,
			undefined,
			undefined,
			undefined
		);

		return h5pPlayer;
	},
};
