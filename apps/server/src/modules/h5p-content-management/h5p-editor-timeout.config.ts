import { CoreModuleConfig } from '@core/core.config';
import { Configuration } from '@hpi-schul-cloud/commons';

export interface H5PEditorCoreConfig extends CoreModuleConfig {
	INCOMING_REQUEST_TIMEOUT: number;
}

const h5pEditorCoreConfig: H5PEditorCoreConfig = {
	INCOMING_REQUEST_TIMEOUT: Configuration.get('H5P_EDITOR__INCOMING_REQUEST_TIMEOUT') as number,
};

export const coreConfig = (): H5PEditorCoreConfig => h5pEditorCoreConfig;
