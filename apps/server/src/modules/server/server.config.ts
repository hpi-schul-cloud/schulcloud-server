import { Configuration } from '@hpi-schul-cloud/commons';
import type { IdentityManagementConfig } from '@infra/identity-management';
import type { SchulconnexClientConfig } from '@infra/schulconnex-client';
import type { AccountConfig } from '@modules/account';
import type { AuthenticationConfig, XApiKeyConfig } from '@modules/authentication';
import type { FilesStorageClientConfig } from '@modules/files-storage-client';
import type { CommonCartridgeConfig, LearnroomConfig } from '@modules/learnroom';
import type { SchoolConfig } from '@modules/school';
import type { UserConfig } from '@modules/user';
import { type IUserImportFeatures, UserImportConfiguration } from '@modules/user-import';
import type { CoreModuleConfig } from '@src/core';
import type { MailConfig } from '@src/infra/mail/interfaces/mail-config';
import { ToolConfiguration, type IToolFeatures } from '@modules/tool';
import { getTldrawClientConfig, type TldrawClientConfig } from '@modules/tldraw-client';
import { VideoConferenceConfiguration, type IVideoConferenceSettings } from '@modules/video-conference';
import type { UserLoginMigrationConfig } from '@modules/user-login-migration';
import type { LessonConfig } from '@modules/lesson';
import type { BoardConfig } from '@modules/board';
import type { SharingConfig } from '@modules/sharing';
import type { SystemConfig } from '@modules/system';

export enum NodeEnvType {
	TEST = 'test',
	DEVELOPMENT = 'development',
	PRODUCTION = 'production',
	MIGRATION = 'migration',
}

// Envirement keys should be added over configs from modules, directly adding is only allow for legacy stuff
// Maye some of them must be outsource to additional microservice config endpoints.
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
		LearnroomConfig,
		AuthenticationConfig,
		IToolFeatures,
		TldrawClientConfig,
		UserLoginMigrationConfig,
		LessonConfig,
		IVideoConferenceSettings,
		BoardConfig,
		LearnroomConfig,
		SharingConfig,
		IUserImportFeatures,
		SchulconnexClientConfig,
		SystemConfig {
	NODE_ENV: string;
	SC_DOMAIN: string;
	ACCESSIBILITY_REPORT_EMAIL: string;
	ADMIN_TABLES_DISPLAY_CONSENT_COLUMN: boolean;
	ALERT_STATUS_URL: string | null;
	FEATURE_ES_COLLECTIONS_ENABLED: boolean;
	FEATURE_EXTENSIONS_ENABLED: boolean;
	FEATURE_TEAMS_ENABLED: boolean;
	FEATURE_LERNSTORE_ENABLED: boolean;
	FEATURE_ADMIN_TOGGLE_STUDENT_LERNSTORE_VIEW_ENABLED: boolean;
	TEACHER_STUDENT_VISIBILITY__IS_ENABLED_BY_DEFAULT: boolean;
	TEACHER_STUDENT_VISIBILITY__IS_VISIBLE: boolean;
	FEATURE_SCHOOL_POLICY_ENABLED_NEW: boolean;
	FEATURE_SCHOOL_TERMS_OF_USE_ENABLED: boolean;
	FEATURE_COLUMN_BOARD_SUBMISSIONS_ENABLED: boolean;
	FEATURE_COLUMN_BOARD_LINK_ELEMENT_ENABLED: boolean;
	FEATURE_COLUMN_BOARD_EXTERNAL_TOOLS_ENABLED: boolean;
	FEATURE_LOGIN_LINK_ENABLED: boolean;
	FEATURE_CONSENT_NECESSARY: boolean;
	FEATURE_SCHOOL_SANIS_USER_MIGRATION_ENABLED: boolean;
	FEATURE_ALLOW_INSECURE_LDAP_URL_ENABLED: boolean;
	GHOST_BASE_URL: string;
	ROCKETCHAT_SERVICE_ENABLED: boolean;
	JWT_SHOW_TIMEOUT_WARNING_SECONDS: number;
	JWT_TIMEOUT_SECONDS: number;
	NOT_AUTHENTICATED_REDIRECT_URL: string;
	DOCUMENT_BASE_DIR: string;
	SC_THEME: string; // should be enum
	SC_TITLE: string; // should be enum
	FEATURE_SHOW_OUTDATED_USERS: boolean;
	FEATURE_NEW_SCHOOL_ADMINISTRATION_PAGE_AS_DEFAULT_ENABLED: boolean;
	FEATURE_ENABLE_LDAP_SYNC_DURING_MIGRATION: boolean;
	FEATURE_SHOW_NEW_CLASS_VIEW_ENABLED: boolean;
	FEATURE_SHOW_MIGRATION_WIZARD: boolean;
	MIGRATION_WIZARD_DOCUMENTATION_LINK?: string;
	FEATURE_TLDRAW_ENABLED: boolean;
	TLDRAW__ASSETS_ENABLED: boolean;
	TLDRAW__ASSETS_MAX_SIZE: number;
	TLDRAW__ASSETS_ALLOWED_EXTENSIONS_LIST?: string;
	I18N__AVAILABLE_LANGUAGES: string; // string[] / enum
	I18N__DEFAULT_LANGUAGE: string; // should be enum
	I18N__FALLBACK_LANGUAGE: string; // should be enum
	I18N__DEFAULT_TIMEZONE: string; // should be enum
}

const config: ServerConfig = {
	ACCESSIBILITY_REPORT_EMAIL: Configuration.get('ACCESSIBILITY_REPORT_EMAIL') as string,
	ADMIN_TABLES_DISPLAY_CONSENT_COLUMN: Configuration.get('ADMIN_TABLES_DISPLAY_CONSENT_COLUMN') as boolean,
	ALERT_STATUS_URL:
		Configuration.get('ALERT_STATUS_URL') === null
			? (Configuration.get('ALERT_STATUS_URL') as null)
			: (Configuration.get('ALERT_STATUS_URL') as string),
	FEATURE_ES_COLLECTIONS_ENABLED: Configuration.get('FEATURE_ES_COLLECTIONS_ENABLED') as boolean,
	FEATURE_EXTENSIONS_ENABLED: Configuration.get('FEATURE_EXTENSIONS_ENABLED') as boolean,
	FEATURE_TEAMS_ENABLED: Configuration.get('FEATURE_TEAMS_ENABLED') as boolean,
	FEATURE_LERNSTORE_ENABLED: Configuration.get('FEATURE_LERNSTORE_ENABLED') as boolean,
	FEATURE_ADMIN_TOGGLE_STUDENT_LERNSTORE_VIEW_ENABLED: Configuration.get(
		'FEATURE_ADMIN_TOGGLE_STUDENT_LERNSTORE_VIEW_ENABLED'
	) as boolean,
	FEATURE_COLUMN_BOARD_ENABLED: Configuration.get('FEATURE_COLUMN_BOARD_ENABLED') as boolean,
	FEATURE_COLUMN_BOARD_SUBMISSIONS_ENABLED: Configuration.get('FEATURE_COLUMN_BOARD_SUBMISSIONS_ENABLED') as boolean,
	FEATURE_COLUMN_BOARD_LINK_ELEMENT_ENABLED: Configuration.get('FEATURE_COLUMN_BOARD_LINK_ELEMENT_ENABLED') as boolean,
	FEATURE_COLUMN_BOARD_EXTERNAL_TOOLS_ENABLED: Configuration.get(
		'FEATURE_COLUMN_BOARD_EXTERNAL_TOOLS_ENABLED'
	) as boolean,
	FEATURE_COURSE_SHARE: Configuration.get('FEATURE_COURSE_SHARE') as boolean,
	FEATURE_LESSON_SHARE: Configuration.get('FEATURE_LESSON_SHARE') as boolean,
	FEATURE_TASK_SHARE: Configuration.get('FEATURE_TASK_SHARE') as boolean,
	FEATURE_LOGIN_LINK_ENABLED: Configuration.get('FEATURE_LOGIN_LINK_ENABLED') as boolean,
	FEATURE_COPY_SERVICE_ENABLED: Configuration.get('FEATURE_COPY_SERVICE_ENABLED') as boolean,
	FEATURE_CONSENT_NECESSARY: Configuration.get('FEATURE_CONSENT_NECESSARY') as boolean,
	FEATURE_SCHOOL_SANIS_USER_MIGRATION_ENABLED: Configuration.get(
		'FEATURE_SCHOOL_SANIS_USER_MIGRATION_ENABLED'
	) as boolean,
	TEACHER_STUDENT_VISIBILITY__IS_ENABLED_BY_DEFAULT: Configuration.get(
		'TEACHER_STUDENT_VISIBILITY__IS_ENABLED_BY_DEFAULT'
	) as boolean,
	TEACHER_STUDENT_VISIBILITY__IS_VISIBLE: Configuration.get('TEACHER_STUDENT_VISIBILITY__IS_VISIBLE') as boolean,
	FEATURE_SCHOOL_POLICY_ENABLED_NEW: Configuration.get('FEATURE_SCHOOL_POLICY_ENABLED_NEW') as boolean,
	FEATURE_SCHOOL_TERMS_OF_USE_ENABLED: Configuration.get('FEATURE_SCHOOL_TERMS_OF_USE_ENABLED') as boolean,
	FEATURE_ALLOW_INSECURE_LDAP_URL_ENABLED: Configuration.get('FEATURE_ALLOW_INSECURE_LDAP_URL_ENABLED') as boolean,
	FEATURE_NEST_SYSTEMS_API_ENABLED: Configuration.get('FEATURE_NEST_SYSTEMS_API_ENABLED') as boolean,
	GHOST_BASE_URL: Configuration.get('GHOST_BASE_URL') as string,
	ROCKETCHAT_SERVICE_ENABLED: Configuration.get('ROCKETCHAT_SERVICE_ENABLED') as boolean,
	JWT_SHOW_TIMEOUT_WARNING_SECONDS: Configuration.get('JWT_SHOW_TIMEOUT_WARNING_SECONDS') as number,
	JWT_TIMEOUT_SECONDS: Configuration.get('JWT_TIMEOUT_SECONDS') as number,
	NOT_AUTHENTICATED_REDIRECT_URL: Configuration.get('NOT_AUTHENTICATED_REDIRECT_URL') as string,
	DOCUMENT_BASE_DIR: Configuration.get('DOCUMENT_BASE_DIR') as string,
	SC_THEME: Configuration.get('SC_THEME') as string,
	SC_TITLE: Configuration.get('SC_TITLE') as string,
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
	TLDRAW__ASSETS_ALLOWED_EXTENSIONS_LIST: Configuration.has('TLDRAW__ASSETS_ALLOWED_EXTENSIONS_LIST')
		? (Configuration.get('TLDRAW__ASSETS_ALLOWED_EXTENSIONS_LIST') as string)
		: undefined,
	FEATURE_TLDRAW_ENABLED: Configuration.get('FEATURE_TLDRAW_ENABLED') as boolean,
	FEATURE_NEW_SCHOOL_ADMINISTRATION_PAGE_AS_DEFAULT_ENABLED: Configuration.get(
		'FEATURE_NEW_SCHOOL_ADMINISTRATION_PAGE_AS_DEFAULT_ENABLED'
	) as boolean,
	MIGRATION_END_GRACE_PERIOD_MS: Configuration.get('MIGRATION_END_GRACE_PERIOD_MS') as number,
	FEATURE_SHOW_OUTDATED_USERS: Configuration.get('FEATURE_SHOW_OUTDATED_USERS') as boolean,
	FEATURE_ENABLE_LDAP_SYNC_DURING_MIGRATION: Configuration.get('FEATURE_ENABLE_LDAP_SYNC_DURING_MIGRATION') as boolean,
	FEATURE_SHOW_NEW_CLASS_VIEW_ENABLED: Configuration.get('FEATURE_SHOW_NEW_CLASS_VIEW_ENABLED') as boolean,
	FEATURE_SHOW_MIGRATION_WIZARD: Configuration.get('FEATURE_SHOW_MIGRATION_WIZARD') as boolean,
	FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_ENABLED: Configuration.get(
		'FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_ENABLED'
	) as boolean,
	FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_MAX_FILE_SIZE: Configuration.get(
		'FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_MAX_FILE_SIZE'
	) as number,
	MIGRATION_WIZARD_DOCUMENTATION_LINK: Configuration.has('MIGRATION_WIZARD_DOCUMENTATION_LINK')
		? (Configuration.get('MIGRATION_WIZARD_DOCUMENTATION_LINK') as string)
		: undefined,
	FEATURE_NEXBOARD_COPY_ENABLED: Configuration.get('FEATURE_NEXBOARD_COPY_ENABLED') as boolean,
	FEATURE_ETHERPAD_ENABLED: Configuration.get('FEATURE_ETHERPAD_ENABLED') as boolean,
	ETHERPAD__PAD_URI: Configuration.has('ETHERPAD__PAD_URI')
		? (Configuration.get('ETHERPAD__PAD_URI') as string)
		: undefined,
	I18N__AVAILABLE_LANGUAGES: Configuration.get('I18N__AVAILABLE_LANGUAGES') as string,
	I18N__DEFAULT_LANGUAGE: Configuration.get('I18N__DEFAULT_LANGUAGE') as string,
	I18N__FALLBACK_LANGUAGE: Configuration.get('I18N__FALLBACK_LANGUAGE') as string,
	I18N__DEFAULT_TIMEZONE: Configuration.get('I18N__DEFAULT_TIMEZONE') as string,
	SCHULCONNEX_CLIENT__PERSONEN_INFO_TIMEOUT_IN_MS: Configuration.get(
		'SCHULCONNEX_CLIENT__PERSONEN_INFO_TIMEOUT_IN_MS'
	) as number,
	...getTldrawClientConfig(),
	...ToolConfiguration.toolFeatures,
	...VideoConferenceConfiguration.videoConference,
	...UserImportConfiguration.userImportFeatures,
};

export const serverConfig = () => config;
export const SERVER_CONFIG_TOKEN = 'SERVER_CONFIG_TOKEN';
