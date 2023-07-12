import { Configuration } from '@hpi-schul-cloud/commons';
import { NodeEnvType } from '@src/modules/server';

const tldrawConfig = {
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
	INCOMING_REQUEST_TIMEOUT: Configuration.get('INCOMING_REQUEST_TIMEOUT_API') as number,
	NODE_ENV: Configuration.get('NODE_ENV') as NodeEnvType,
};

export const config = () => tldrawConfig;
