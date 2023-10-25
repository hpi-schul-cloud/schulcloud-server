import { Configuration } from '@hpi-schul-cloud/commons';
import type { IIdentityManagementConfig } from '@shared/infra/identity-management';
import type { ICoreModuleConfig } from '@src/core';
import type { IAccountConfig } from '@src/modules/account';
import type { IFilesStorageClientConfig } from '@src/modules/files-storage-client';
import type { IUserConfig } from '@src/modules/user';
import type { ICommonCartridgeConfig } from '@src/modules/learnroom/common-cartridge';
import type { SchoolConfig } from '@src/modules/school';

export enum NodeEnvType {
	TEST = 'test',
	DEVELOPMENT = 'development',
	PRODUCTION = 'production',
	MIGRATION = 'migration',
}

export interface IServerConfig
	extends ICoreModuleConfig,
		IUserConfig,
		SchoolConfig,
		IFilesStorageClientConfig,
		IAccountConfig,
		IIdentityManagementConfig,
		ICommonCartridgeConfig {
	// should not used
	NODE_ENV: string;
	SC_DOMAIN: string;
	TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE: boolean; // TODO: Wrong placed, must move into module that us it
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
	STUDENT_TEAM_CREATION: Configuration.get('STUDENT_TEAM_CREATION') as string,
};

export const serverConfig = () => config;
