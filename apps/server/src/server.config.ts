import { Configuration } from '@hpi-schul-cloud/commons';
import type { ICoreModuleConfig } from '@src/core';
import type { IUserConfig, IFilesStorageClientConfig, IAccountConfig } from '@src/modules/';
import { AvailableLogLevel } from './core/logger';

export enum NodeEnvType {
	TEST = 'test',
	DEVELOPMENT = 'development',
	PRODUCTION = 'production',
	MIGRATION = 'migration',
}

export interface IServerConfig extends ICoreModuleConfig, IUserConfig, IFilesStorageClientConfig, IAccountConfig {
	NODE_ENV: string;
	FEATURE_COURSE_EXPORT_ENABLED: boolean;
}

const config: IServerConfig = {
	INCOMING_REQUEST_TIMEOUT: Configuration.get('INCOMING_REQUEST_TIMEOUT_API') as number,
	INCOMING_REQUEST_TIMEOUT_COPY_API: Configuration.get('INCOMING_REQUEST_TIMEOUT_COPY_API') as number,
	AVAILABLE_LOG_LEVELS: (Configuration.get('NEST_AVAILABLE_LOG_LEVELS') as string).split(',') as AvailableLogLevel[],
	AVAILABLE_LANGUAGES: (Configuration.get('I18N__AVAILABLE_LANGUAGES') as string).split(','),
	FILE_STORAGE_BASE_URL: Configuration.get('FILES_STORAGE__SERVICE_BASE_URL') as string,
	NODE_ENV: Configuration.get('NODE_ENV') as NodeEnvType,
	LOGIN_BLOCK_TIME: Configuration.get('LOGIN_BLOCK_TIME') as number,
	TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE: Configuration.get(
		'TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE'
	) as boolean,
	FEATURE_COURSE_EXPORT_ENABLED: Configuration.get('FEATURE_COURSE_EXPORT_ENABLED') as boolean,
};

export default () => config;
