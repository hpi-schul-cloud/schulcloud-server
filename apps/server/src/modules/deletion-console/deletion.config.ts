import { Configuration } from '@hpi-schul-cloud/commons';
import { ConsoleWriterConfig } from '@infra/console';

export interface DeletionConsoleConfig extends ConsoleWriterConfig {
	ADMIN_API_CLIENT_BASE_URL: string;
	ADMIN_API_CLIENT_API_KEY: string;
	LOGIN_BLOCK_TIME: number; // @TODO temporary until removed from other configs
}

const config: DeletionConsoleConfig = {
	ADMIN_API_CLIENT_BASE_URL: Configuration.get('ADMIN_API_CLIENT__BASE_URL') as string,
	ADMIN_API_CLIENT_API_KEY: Configuration.get('ADMIN_API_CLIENT__API_KEY') as string,
	LOGIN_BLOCK_TIME: Configuration.get('LOGIN_BLOCK_TIME') as number,
};

export const deletionConsoleConfig = () => config;
