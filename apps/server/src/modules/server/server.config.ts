import { Configuration } from '@hpi-schul-cloud/commons';
import type { IdentityManagementConfig } from '@infra/identity-management';
import type { AccountConfig } from '@modules/account';
import type { FilesStorageClientConfig } from '@modules/files-storage-client';
import type { CommonCartridgeConfig } from '@modules/learnroom/common-cartridge';
import type { UserConfig } from '@modules/user';
import type { CoreModuleConfig } from '@src/core';
import { MailConfig } from '@src/infra/mail/interfaces/mail-config';
import { XApiKeyConfig } from '@modules/authentication';

export enum NodeEnvType {
	TEST = 'test',
	DEVELOPMENT = 'development',
	PRODUCTION = 'production',
	MIGRATION = 'migration',
}

export interface ServerConfig
	extends CoreModuleConfig,
		UserConfig,
		FilesStorageClientConfig,
		AccountConfig,
		IdentityManagementConfig,
		CommonCartridgeConfig,
		MailConfig,
		XApiKeyConfig {
	NODE_ENV: string;
	SC_DOMAIN: string;
}

const config: ServerConfig = {
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
	ADMIN_API__ALLOWED_API_KEYS: (Configuration.get('ADMIN_API__ALLOWED_API_KEYS') as string)
		.split(',')
		.map((apiKey) => apiKey.trim()),
	ADDITIONAL_BLACKLISTED_EMAIL_DOMAINS: (Configuration.get('ADDITIONAL_BLACKLISTED_EMAIL_DOMAINS') as string)
		.split(',')
		.map((domain) => domain.trim()),
};

export const serverConfig = () => config;
