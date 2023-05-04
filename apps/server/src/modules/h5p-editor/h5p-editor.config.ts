import { Configuration } from '@hpi-schul-cloud/commons';

const h5pEditorConfig = {
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
	INCOMING_REQUEST_TIMEOUT: Configuration.get('H5P_EDITOR__INCOMING_REQUEST_TIMEOUT') as number,
};

export const config = () => h5pEditorConfig;
