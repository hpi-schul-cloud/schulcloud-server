import { Configuration } from '@hpi-schul-cloud/commons/lib';

export interface DeletionClientConfig {
	ADMIN_API_BASE_URL: string;
	ADMIN_API_KEY: string;
}

const deletionClientConfig = {
	ADMIN_API_BASE_URL: Configuration.get('ADMIN_API_BASE_URL') as string,
	ADMIN_API_KEY: Configuration.get('ADMIN_API_KEY') as string,
};

export const config = () => {};
