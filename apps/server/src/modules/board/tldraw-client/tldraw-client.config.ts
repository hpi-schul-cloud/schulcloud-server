import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { DeletionClientConfig } from './interface';

export const getTldrawClientConfig = (): DeletionClientConfig => {
	return {
		TLDRAW_ADMIN_API_CLIENT_BASE_URL: Configuration.get('TLDRAW_ADMIN_API_CLIENT__BASE_URL') as string,
		TLDRAW_ADMIN_API_CLIENT_API_KEY: Configuration.get('TLDRAW_ADMIN_API_CLIENTT__API_KEY') as string,
	};
};
