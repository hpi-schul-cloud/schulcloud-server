import { Configuration } from '@hpi-schul-cloud/commons';
import { CoreModuleConfig } from '@src/core';

export interface EduSharingConfig extends CoreModuleConfig {
	APP_ID: string;
	DOMAIN: string;
	PRIVATE_KEY: string;
	PUBLIC_KEY: string;
}

export const defaultConfig = {
	INCOMING_REQUEST_TIMEOUT: Configuration.get('EDU_SHARING__INCOMING_REQUEST_TIMEOUT') as number,
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
};

const eduSharingConfig: EduSharingConfig = {
	APP_ID: Configuration.get('EDU_SHARING__APP_ID') as string,
	DOMAIN: Configuration.get('EDU_SHARING__DOMAIN') as string,
	PRIVATE_KEY: Configuration.get('EDU_SHARING__PRIVATE_KEY') as string,
	PUBLIC_KEY: Configuration.get('EDU_SHARING__PUBLIC_KEY') as string,
	...defaultConfig,
};

export const config = () => eduSharingConfig;
