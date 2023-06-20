import { Configuration } from '@hpi-schul-cloud/commons';

const tldrawConfig = {
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
	INCOMING_REQUEST_TIMEOUT: Configuration.get('INCOMING_REQUEST_TIMEOUT_API') as number,
};

export const config = () => tldrawConfig;
