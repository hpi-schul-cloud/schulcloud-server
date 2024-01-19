import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { DeletionClientConfig } from './interface';

export const getDeletionClientConfig = (): DeletionClientConfig => {
	return {
		ADMIN_API_CLIENT_BASE_URL: Configuration.get('ADMIN_API_CLIENT__BASE_URL') as string,
		ADMIN_API_CLIENT_API_KEY: Configuration.get('ADMIN_API_CLIENT__API_KEY') as string,
	};
};
