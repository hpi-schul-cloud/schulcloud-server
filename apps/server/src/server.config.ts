import { Configuration } from '@hpi-schul-cloud/commons';
import type { ICoreModuleConfig } from '@src/core';
import type { IUserConfig, IFilesStorageClientConfig } from '@src/modules/';
import { AvailableLogLevel } from './core/logger';

export enum NodeEnvType {
	TEST = 'test',
	DEVELOPMENT = 'development',
	PRODUCTION = 'production',
	MIGRATION = 'migration',
}

export interface IServerConfig extends ICoreModuleConfig, IUserConfig, IFilesStorageClientConfig {
	NODE_ENV: string;
}

const config: IServerConfig = {
	INCOMING_REQUEST_TIMEOUT: Configuration.get('INCOMING_REQUEST_TIMEOUT_API') as number,
	INCOMING_REQUEST_TIMEOUT_COPY_API: Configuration.get('INCOMING_REQUEST_TIMEOUT_COPY_API') as number,
	AVAILABLE_LOG_LEVELS: (Configuration.get('NEST_AVAILABLE_LOG_LEVELS') as string).split(',') as AvailableLogLevel[],
	AVAILABLE_LANGUAGES: (Configuration.get('I18N__AVAILABLE_LANGUAGES') as string).split(','),
	FILE_STORAGE_BASE_URL: Configuration.get('FILES_STORAGE__SERVICE_BASE_URL') as string,
	NODE_ENV: Configuration.get('NODE_ENV') as NodeEnvType,
};

export default () => config;
