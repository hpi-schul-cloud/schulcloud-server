import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { TldrawClientConfig } from './interface';

export const getTldrawClientConfig = (): TldrawClientConfig => {
	const WITH_TLDRAW = Configuration.get('WITH_TLDRAW2');
	const A = Configuration.get('WITH_TLDRAW2');
	console.log('WITH_TLDRAW2', A, typeof A);
	const config = {
		TLDRAW_ADMIN_API_CLIENT_BASE_URL: Configuration.get('TLDRAW_ADMIN_API_CLIENT__BASE_URL') as string,
		TLDRAW_ADMIN_API_CLIENT_API_KEY: Configuration.get('TLDRAW_ADMIN_API_CLIENT__API_KEY') as string,
		WITH_TLDRAW2: WITH_TLDRAW as boolean,
	};

	return config;
};
