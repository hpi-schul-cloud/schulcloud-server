import { Configuration } from '@hpi-schul-cloud/commons';
import { CoreModuleConfig } from '@src/core';

export interface EduSharingConfig extends CoreModuleConfig {}

export const defaultConfig = {
	DOMAIN: Configuration.get('EDU_SHARING__DOMAIN') as string,
	INCOMING_REQUEST_TIMEOUT: Configuration.get('EDU_SHARING__INCOMING_REQUEST_TIMEOUT') as number,
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
};

const eduSharingConfig: EduSharingConfig = {
	...defaultConfig,
};

export const config = () => eduSharingConfig;
