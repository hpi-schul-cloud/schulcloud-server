import { Configuration } from '@hpi-schul-cloud/commons';
import type { IdentityManagementConfig } from '@infra/identity-management';
import type { AccountConfig } from '@modules/account';
import type { AuthenticationConfig, XApiKeyConfig } from '@modules/authentication';
import type { FilesStorageClientConfig } from '@modules/files-storage-client';
import type { CommonCartridgeConfig } from '@modules/learnroom';
import type { SchoolConfig } from '@modules/school';
import type { UserConfig } from '@modules/user';
import type { CoreModuleConfig } from '@src/core';
import type { MailConfig } from '@src/infra/mail/interfaces/mail-config';
import { ToolConfiguration, type IToolFeatures } from '@modules/tool';
import { getTldrawClientConfig, type TldrawClientConfig } from '@modules/tldraw-client';
import type { UserLoginMigrationConfig } from '@modules/user-login-migration';

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
		SchoolConfig,
		MailConfig,
		XApiKeyConfig,
		AuthenticationConfig,
		IToolFeatures,
		TldrawClientConfig,
		UserLoginMigrationConfig {
	NODE_ENV: string;
	SC_DOMAIN: string;
	FILES_STORAGE__MAX_FILE_SIZE: number; // TODO: Wrong placed it must be moved to files-storage! Also remove it from public config api response.
	FEATURE_SHOW_OUTDATED_USERS: boolean;
	FEATURE_NEW_SCHOOL_ADMINISTRATION_PAGE_AS_DEFAULT_ENABLED: boolean;
	FEATURE_ENABLE_LDAP_SYNC_DURING_MIGRATION: boolean;
	FEATURE_SHOW_NEW_CLASS_VIEW_ENABLED: boolean;
	FEATURE_SHOW_MIGRATION_WIZARD: boolean;
	MIGRATION_WIZARD_DOCUMENTATION_LINK: string | undefined; // is implemented in legacy in this way
	FEATURE_TLDRAW_ENABLED: boolean;
	TLDRAW__ASSETS_ENABLED: boolean;
	TLDRAW__ASSETS_MAX_SIZE: number;
	TLDRAW__ASSETS_ALLOWED_EXTENSIONS_LIST: string;
}

const config: ServerConfig = {
	SC_DOMAIN: Configuration.get('SC_DOMAIN') as string,
	INCOMING_REQUEST_TIMEOUT: Configuration.get('INCOMING_REQUEST_TIMEOUT_API') as number,
	INCOMING_REQUEST_TIMEOUT_COPY_API: Configuration.get('INCOMING_REQUEST_TIMEOUT_COPY_API') as number,
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
	EXIT_ON_ERROR: Configuration.get('EXIT_ON_ERROR') as boolean,
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
	ADMIN_API__ALLOWED_API_KEYS: (Configuration.get('ADMIN_API__ALLOWED_API_KEYS') as string)
		.split(',')
		.map((apiKey) => apiKey.trim()),
	BLOCKLIST_OF_EMAIL_DOMAINS: (Configuration.get('BLOCKLIST_OF_EMAIL_DOMAINS') as string)
		.split(',')
		.map((domain) => domain.trim()),
	TLDRAW__ASSETS_ENABLED: Configuration.get('TLDRAW__ASSETS_ENABLED') as boolean,
	TLDRAW__ASSETS_MAX_SIZE: Configuration.get('TLDRAW__ASSETS_MAX_SIZE') as number,
	TLDRAW__ASSETS_ALLOWED_EXTENSIONS_LIST: Configuration.get('TLDRAW__ASSETS_ALLOWED_EXTENSIONS_LIST') as string,
	FEATURE_TLDRAW_ENABLED: Configuration.get('FEATURE_TLDRAW_ENABLED') as boolean,
	FEATURE_NEW_SCHOOL_ADMINISTRATION_PAGE_AS_DEFAULT_ENABLED: Configuration.get(
		'FEATURE_NEW_SCHOOL_ADMINISTRATION_PAGE_AS_DEFAULT_ENABLED'
	) as boolean,
	MIGRATION_END_GRACE_PERIOD_MS: Configuration.get('MIGRATION_END_GRACE_PERIOD_MS') as number,
	FILES_STORAGE__MAX_FILE_SIZE: Configuration.get('FILES_STORAGE__MAX_FILE_SIZE') as number,
	FEATURE_SHOW_OUTDATED_USERS: Configuration.get('FEATURE_SHOW_OUTDATED_USERS') as boolean,
	FEATURE_ENABLE_LDAP_SYNC_DURING_MIGRATION: Configuration.get('FEATURE_ENABLE_LDAP_SYNC_DURING_MIGRATION') as boolean,
	FEATURE_SHOW_NEW_CLASS_VIEW_ENABLED: Configuration.get('FEATURE_SHOW_NEW_CLASS_VIEW_ENABLED') as boolean,
	FEATURE_SHOW_MIGRATION_WIZARD: Configuration.get('FEATURE_SHOW_MIGRATION_WIZARD') as boolean,
	MIGRATION_WIZARD_DOCUMENTATION_LINK: Configuration.has('MIGRATION_WIZARD_DOCUMENTATION_LINK')
		? (Configuration.get('MIGRATION_WIZARD_DOCUMENTATION_LINK') as string)
		: undefined,
	...getTldrawClientConfig(),
	...ToolConfiguration.toolFeatures,
};

export const serverConfig = () => config;
export const SERVER_CONFIG_TOKEN = 'SERVER_CONFIG_TOKEN';
