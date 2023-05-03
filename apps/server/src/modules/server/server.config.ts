import { Configuration } from '@hpi-schul-cloud/commons';
import type { IIdentityManagementConfig } from '@shared/infra/identity-management';
import type { ICoreModuleConfig } from '@src/core';
import type { IAccountConfig, IFilesStorageClientConfig, IUserConfig } from '@src/modules/';
import type { ICommonCartridgeConfig } from '@src/modules/learnroom/common-cartridge';

export enum NodeEnvType {
	TEST = 'test',
	DEVELOPMENT = 'development',
	PRODUCTION = 'production',
	MIGRATION = 'migration',
}

export interface IServerConfig
	extends ICoreModuleConfig,
		IUserConfig,
		IFilesStorageClientConfig,
		IAccountConfig,
		IIdentityManagementConfig,
		ICommonCartridgeConfig {
	NODE_ENV: string;
	SC_DOMAIN: string;
}

const config: IServerConfig = {
	SC_DOMAIN: Configuration.get('SC_DOMAIN') as string,
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
	FEATURE_IDENTITY_MANAGEMENT_ENABLED: Configuration.get('FEATURE_IDENTITY_MANAGEMENT_ENABLED') as boolean,
	FEATURE_IDENTITY_MANAGEMENT_STORE_ENABLED: Configuration.get('FEATURE_IDENTITY_MANAGEMENT_STORE_ENABLED') as boolean,
	FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED: Configuration.get('FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED') as boolean,
};

export const serverConfig = () => config;
