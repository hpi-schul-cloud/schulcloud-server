import { Configuration } from '@hpi-schul-cloud/commons';

export interface CommonCartridgeConfig {
	NEST_LOG_LEVEL: string;
}

const commonCartridgeConfig: CommonCartridgeConfig = {
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
};

export function config(): CommonCartridgeConfig {
	return commonCartridgeConfig;
}
