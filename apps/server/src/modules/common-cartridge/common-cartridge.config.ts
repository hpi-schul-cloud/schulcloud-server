import { Configuration } from '@hpi-schul-cloud/commons';

export interface CommonCartridgeConfig {
	NEST_LOG_LEVEL: string;
	INCOMING_REQUEST_TIMEOUT: number;
}

const commonCartridgeConfig: CommonCartridgeConfig = {
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
	INCOMING_REQUEST_TIMEOUT: Configuration.get('FILES_STORAGE__INCOMING_REQUEST_TIMEOUT') as number,
};

export function config(): CommonCartridgeConfig {
	return commonCartridgeConfig;
}
