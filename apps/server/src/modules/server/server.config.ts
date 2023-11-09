import { Configuration } from '@hpi-schul-cloud/commons';
import type { IIdentityManagementConfig } from '@infra/identity-management';
import type { ICoreModuleConfig } from '@src/core';
import type { IAccountConfig } from '@modules/account';
import type { IFilesStorageClientConfig } from '@modules/files-storage-client';
import type { IUserConfig } from '@modules/user';
import type { ICommonCartridgeConfig } from '@modules/learnroom/common-cartridge';
import { IMailConfig } from '@src/infra/mail/interfaces/mail-config';
import { IXApiKeyConfig } from '../authentication/config/x-api-key.config';

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
		ICommonCartridgeConfig,
		IMailConfig,
		IXApiKeyConfig {
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
	ADDITIONAL_BLACKLISTED_EMAIL_DOMAINS: (Configuration.get('ADDITIONAL_BLACKLISTED_EMAIL_DOMAINS') as string)
		.split(',')
		.map((domain) => domain.trim()),
	ADMIN_API__ALLOWED_API_KEYS: (Configuration.get('ADMIN_API__ALLOWED_API_KEYS') as string)
		.split(',')
		.map((apiKey) => apiKey.trim()),
};

export const serverConfig = () => config;
