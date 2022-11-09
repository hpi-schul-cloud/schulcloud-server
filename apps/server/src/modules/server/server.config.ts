import { Configuration } from '@hpi-schul-cloud/commons';
import type { ICoreModuleConfig } from '@src/core';
import type { IAccountConfig, IFilesStorageClientConfig, IUserConfig } from '@src/modules/';

export enum NodeEnvType {
	TEST = 'test',
	DEVELOPMENT = 'development',
	PRODUCTION = 'production',
	MIGRATION = 'migration',
}

interface IFeatureConfig {
	FEATURE_IMSCC_COURSE_EXPORT_ENABLED: boolean;
}

export interface IServerConfig
	extends ICoreModuleConfig,
		IFeatureConfig,
		IUserConfig,
		IFilesStorageClientConfig,
		IAccountConfig {
	NODE_ENV: string;
}

const config: IServerConfig = {
	INCOMING_REQUEST_TIMEOUT: Configuration.get('INCOMING_REQUEST_TIMEOUT_API') as number,
	INCOMING_REQUEST_TIMEOUT_COPY_API: Configuration.get('INCOMING_REQUEST_TIMEOUT_COPY_API') as number,
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
	AVAILABLE_LANGUAGES: (Configuration.get('I18N__AVAILABLE_LANGUAGES') as string).split(','),
	NODE_ENV: Configuration.get('NODE_ENV') as NodeEnvType,
	LOGIN_BLOCK_TIME: Configuration.get('LOGIN_BLOCK_TIME') as number,
	TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE: Configuration.get(
		'TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE'
	) as boolean,
	FEATURE_IMSCC_COURSE_EXPORT_ENABLED: Configuration.get('FEATURE_IMSCC_COURSE_EXPORT_ENABLED') as boolean,
};

export const serverConfig = () => config;
