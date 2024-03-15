import { H5PConfig, UrlGenerator } from '@lumieducation/h5p-server';

const STATIC_FILES_BASE = '/h5pstatics';

export const h5pConfig = new H5PConfig(undefined);

h5pConfig.baseUrl = '/api/v3/h5p-editor';

h5pConfig.ajaxUrl = '/ajax';
h5pConfig.contentFilesUrl = '/content';
// h5pConfig.contentFilesUrlPlayerOverride = '/content/{{contentId}}';
h5pConfig.contentUserDataUrl = '/contentUserData';

h5pConfig.librariesUrl = '/libraries';
h5pConfig.paramsUrl = '/params';
h5pConfig.playUrl = '/play';
h5pConfig.setFinishedUrl = '/finishedData';
h5pConfig.temporaryFilesUrl = '/temp-files';

h5pConfig.coreUrl = `${STATIC_FILES_BASE}/core`;
h5pConfig.editorLibraryUrl = `${STATIC_FILES_BASE}/editor`;

h5pConfig.contentUserStateSaveInterval = false;
h5pConfig.setFinishedEnabled = false;

export const h5pUrlGenerator = new UrlGenerator(h5pConfig);
