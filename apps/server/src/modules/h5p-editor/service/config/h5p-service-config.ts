import { H5PConfig, UrlGenerator } from '@lumieducation/h5p-server';

export const h5pConfig = new H5PConfig(undefined, {
	baseUrl: '/api/v3/h5p-editor',
	contentUserStateSaveInterval: false,
	setFinishedEnabled: false,
});

export const h5pUrlGenerator = new UrlGenerator(h5pConfig);
