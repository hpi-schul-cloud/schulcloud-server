import { Configuration } from '@hpi-schul-cloud/commons';

const commonCartridgeConfig = {
	NEST_LOG_LEVE: Configuration.get('NEST_LOG_LEVEL') as string,
};

export const config = () => commonCartridgeConfig;
