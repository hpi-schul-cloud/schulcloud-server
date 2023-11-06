import { H5PConfig, UrlGenerator } from '@lumieducation/h5p-server';

const API_BASE = '/api/v3/h5p-editor';
const STATIC_FILES_BASE = '/h5pstatics';

export const h5pConfig = new H5PConfig(undefined, {
	baseUrl: '',

	ajaxUrl: `${API_BASE}/ajax`,
	contentFilesUrl: `${API_BASE}/content`,
	contentFilesUrlPlayerOverride: undefined,
	contentUserDataUrl: `${API_BASE}/contentUserData`,
	downloadUrl: undefined,
	librariesUrl: `${API_BASE}/libraries`,
	paramsUrl: `${API_BASE}/params`,
	playUrl: `${API_BASE}/play`,
	setFinishedUrl: `${API_BASE}/finishedData`,
	temporaryFilesUrl: `${API_BASE}/temp-files`,

	coreUrl: `${STATIC_FILES_BASE}/core`,
	editorLibraryUrl: `${STATIC_FILES_BASE}/editor`,

	contentUserStateSaveInterval: false,
	setFinishedEnabled: false,
});

export const h5pUrlGenerator = new UrlGenerator(h5pConfig);
