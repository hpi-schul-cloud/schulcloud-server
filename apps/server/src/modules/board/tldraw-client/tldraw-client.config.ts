import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { TldrawClientConfig } from './interface';

export const getTldrawClientConfig = (): TldrawClientConfig => {
	return {
		TLDRAW_ADMIN_API_CLIENT_BASE_URL: Configuration.get('TLDRAW_ADMIN_API_CLIENT__BASE_URL') as string,
		TLDRAW_ADMIN_API_CLIENT_API_KEY: Configuration.get('TLDRAW_ADMIN_API_CLIENT__API_KEY') as string,
		INCOMING_REQUEST_TIMEOUT: Configuration.get('INCOMING_REQUEST_TIMEOUT_API') as number,
		NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
	};
};
