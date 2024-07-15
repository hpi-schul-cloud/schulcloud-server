import { Configuration } from '@hpi-schul-cloud/commons';
import { CoreModuleConfig } from '@src/core';

export interface EduSharingConfig extends CoreModuleConfig {
	APP_ID: string;
	API_URL: string;
}

export const defaultConfig = {
	INCOMING_REQUEST_TIMEOUT: Configuration.get('EDU_SHARING__INCOMING_REQUEST_TIMEOUT') as number,
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
};

const eduSharingConfig: EduSharingConfig = {
	APP_ID: Configuration.get('EDU_SHARING__APP_ID') as string,
	API_URL: Configuration.get('EDU_SHARING__API_URL') as string,
	...defaultConfig,
};

export const config = () => eduSharingConfig;
