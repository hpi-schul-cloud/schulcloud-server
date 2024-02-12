import { H5PConfig, UrlGenerator } from '@lumieducation/h5p-server';

const API_BASE = '/api/v3/h5p-editor';
const STATIC_FILES_BASE = '/h5pstatics';

export const h5pConfig = new H5PConfig(undefined);

h5pConfig.baseUrl = '';

h5pConfig.ajaxUrl = `${API_BASE}/ajax`;
h5pConfig.contentFilesUrl = `${API_BASE}/content`;
h5pConfig.contentFilesUrlPlayerOverride = `${API_BASE}/content/{{contentId}}`;
h5pConfig.contentUserDataUrl = `${API_BASE}/contentUserData`;

h5pConfig.librariesUrl = `${API_BASE}/libraries`;
h5pConfig.paramsUrl = `${API_BASE}/params`;
h5pConfig.playUrl = `${API_BASE}/play`;
h5pConfig.setFinishedUrl = `${API_BASE}/finishedData`;
h5pConfig.temporaryFilesUrl = `${API_BASE}/temp-files`;

h5pConfig.coreUrl = `${STATIC_FILES_BASE}/core`;
h5pConfig.editorLibraryUrl = `${STATIC_FILES_BASE}/editor`;

h5pConfig.contentUserStateSaveInterval = false;
h5pConfig.setFinishedEnabled = false;

export const h5pUrlGenerator = new UrlGenerator(h5pConfig);
