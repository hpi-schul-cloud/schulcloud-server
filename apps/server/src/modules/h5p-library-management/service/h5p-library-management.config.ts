import { CoreModuleConfig } from '@core/core.config';
import { Configuration } from '@hpi-schul-cloud/commons';

export const config: CoreModuleConfig = {
	INCOMING_REQUEST_TIMEOUT: Configuration.get('INCOMING_REQUEST_TIMEOUT_API') as number,
};

export const h5PLibraryManagementConfig = () => config;
