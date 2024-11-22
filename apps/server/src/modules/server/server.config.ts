import { Configuration } from '@hpi-schul-cloud/commons';
import { JwtAuthGuardConfig } from '@infra/auth-guard';
import { EncryptionConfig } from '@infra/encryption/encryption.config';
import type { IdentityManagementConfig } from '@infra/identity-management';
import type { MailConfig } from '@infra/mail/interfaces/mail-config';
import type { SchulconnexClientConfig } from '@infra/schulconnex-client';
import { TspSyncConfig } from '@infra/sync';
import type { TspClientConfig } from '@infra/tsp-client';
import type { AccountConfig } from '@modules/account';
import { AlertConfig } from '@modules/alert';
import type { AuthenticationConfig } from '@modules/authentication';
import type { BoardConfig, MediaBoardConfig } from '@modules/board';
import type { CollaborativeTextEditorConfig } from '@modules/collaborative-text-editor';
import type { FilesStorageClientConfig } from '@modules/files-storage-client';
import { SynchronizationConfig } from '@modules/idp-console';
import type { LearnroomConfig } from '@modules/learnroom';
import type { LessonConfig } from '@modules/lesson';
import { OauthConfig } from '@modules/oauth';
import { ProvisioningConfig } from '@modules/provisioning';
import { RocketChatUserConfig } from '@modules/rocketchat-user';
import { RoomConfig } from '@modules/room';
import type { SchoolConfig } from '@modules/school';
import type { SharingConfig } from '@modules/sharing';
import type { ShdConfig } from '@modules/shd';
import { getTldrawClientConfig, type TldrawClientConfig } from '@modules/tldraw-client';
import type { ToolConfig } from '@modules/tool';
import type { UserConfig } from '@modules/user';
import type { UserImportConfig } from '@modules/user-import';
import type { UserLoginMigrationConfig } from '@modules/user-login-migration';
import type { VideoConferenceConfig } from '@modules/video-conference';
import type { BbbConfig } from '@modules/video-conference/bbb';
import type { LanguageType } from '@shared/domain/interface';
import { SchulcloudTheme } from '@shared/domain/types';
import type { CoreModuleConfig } from '@src/core';
import { Algorithm } from 'jsonwebtoken';
import type { Timezone } from './types/timezone.enum';

export enum NodeEnvType {
	TEST = 'test',
	DEVELOPMENT = 'development',
	PRODUCTION = 'production',
	MIGRATION = 'migration',
}

// Environment keys should be added over configs from modules, directly adding is only allow for legacy stuff
// Maye some of them must be outsourced to additional microservice config endpoints.
export interface ServerConfig
	extends CoreModuleConfig,
		UserConfig,
		FilesStorageClientConfig,
		AccountConfig,
		IdentityManagementConfig,
		SchoolConfig,
		MailConfig,
		JwtAuthGuardConfig,
		RocketChatUserConfig,
		LearnroomConfig,
		AuthenticationConfig,
		ToolConfig,
		TldrawClientConfig,
		UserLoginMigrationConfig,
		LessonConfig,
		BoardConfig,
		MediaBoardConfig,
		SharingConfig,
		UserImportConfig,
		SchulconnexClientConfig,
		SynchronizationConfig,
		CollaborativeTextEditorConfig,
		ProvisioningConfig,
		RoomConfig,
		UserImportConfig,
		VideoConferenceConfig,
		BbbConfig,
		TspClientConfig,
		TspSyncConfig,
		AlertConfig,
		ShdConfig,
		OauthConfig,
		EncryptionConfig {
	NODE_ENV: NodeEnvType;
	SC_DOMAIN: string;
	HOST: string;
	ACCESSIBILITY_REPORT_EMAIL: string;
	ADMIN_TABLES_DISPLAY_CONSENT_COLUMN: boolean;
	ALERT_STATUS_URL: string | null;
	CALENDAR_SERVICE_ENABLED: boolean;
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
	FEATURE_COLUMN_BOARD_COLLABORATIVE_TEXT_EDITOR_ENABLED: boolean;
	FEATURE_COLUMN_BOARD_SHARE: boolean;
	FEATURE_COLUMN_BOARD_SOCKET_ENABLED: boolean;
	FEATURE_BOARD_LAYOUT_ENABLED: boolean;
	FEATURE_CONSENT_NECESSARY: boolean;
	FEATURE_ALLOW_INSECURE_LDAP_URL_ENABLED: boolean;
	GHOST_BASE_URL: string;
	ROCKETCHAT_SERVICE_ENABLED: boolean;
	JWT_SHOW_TIMEOUT_WARNING_SECONDS: number;
	JWT_TIMEOUT_SECONDS: number;
	NOT_AUTHENTICATED_REDIRECT_URL: string;
	DOCUMENT_BASE_DIR: string;
	SC_THEME: SchulcloudTheme;
	SC_TITLE: string;
	TRAINING_URL: string;
	FEATURE_NEW_SCHOOL_ADMINISTRATION_PAGE_AS_DEFAULT_ENABLED: boolean;
	FEATURE_ENABLE_LDAP_SYNC_DURING_MIGRATION: boolean;
	FEATURE_SHOW_NEW_CLASS_VIEW_ENABLED: boolean;
	FEATURE_SHOW_NEW_ROOMS_VIEW_ENABLED: boolean;
	FEATURE_TLDRAW_ENABLED: boolean;
	TLDRAW__WEBSOCKET_URL: string;
	TLDRAW__ASSETS_ENABLED: boolean;
	TLDRAW__ASSETS_MAX_SIZE_BYTES: number;
	TLDRAW__ASSETS_ALLOWED_MIME_TYPES_LIST: string[];
	I18N__AVAILABLE_LANGUAGES: LanguageType[];
	I18N__DEFAULT_LANGUAGE: LanguageType;
	I18N__FALLBACK_LANGUAGE: LanguageType;
	I18N__DEFAULT_TIMEZONE: Timezone;
	BOARD_COLLABORATION_URI: string;
	FEATURE_AI_TUTOR_ENABLED: boolean;
	FEATURE_ROOMS_ENABLED: boolean;
	FEATURE_TSP_SYNC_ENABLED: boolean;
}

const config: ServerConfig = {
	ACCESSIBILITY_REPORT_EMAIL: Configuration.get('ACCESSIBILITY_REPORT_EMAIL') as string,
	ADMIN_TABLES_DISPLAY_CONSENT_COLUMN: Configuration.get('ADMIN_TABLES_DISPLAY_CONSENT_COLUMN') as boolean,
	ALERT_STATUS_URL:
		Configuration.get('ALERT_STATUS_URL') === null
			? (Configuration.get('ALERT_STATUS_URL') as null)
			: (Configuration.get('ALERT_STATUS_URL') as string),
	CALENDAR_SERVICE_ENABLED: Configuration.get('CALENDAR_SERVICE_ENABLED') as boolean,
	DISABLED_BRUTE_FORCE_CHECK: Configuration.get('DISABLED_BRUTE_FORCE_CHECK') as boolean,
	FEATURE_ES_COLLECTIONS_ENABLED: Configuration.get('FEATURE_ES_COLLECTIONS_ENABLED') as boolean,
	FEATURE_EXTENSIONS_ENABLED: Configuration.get('FEATURE_EXTENSIONS_ENABLED') as boolean,
	FEATURE_JWT_EXTENDED_TIMEOUT_ENABLED: Configuration.get('FEATURE_JWT_EXTENDED_TIMEOUT_ENABLED') as boolean,
	FEATURE_TEAMS_ENABLED: Configuration.get('FEATURE_TEAMS_ENABLED') as boolean,
	FEATURE_LERNSTORE_ENABLED: Configuration.get('FEATURE_LERNSTORE_ENABLED') as boolean,
	FEATURE_ADMIN_TOGGLE_STUDENT_LERNSTORE_VIEW_ENABLED: Configuration.get(
		'FEATURE_ADMIN_TOGGLE_STUDENT_LERNSTORE_VIEW_ENABLED'
	) as boolean,
	FEATURE_COLUMN_BOARD_ENABLED: Configuration.get('FEATURE_COLUMN_BOARD_ENABLED') as boolean,
	FEATURE_COLUMN_BOARD_SUBMISSIONS_ENABLED: Configuration.get('FEATURE_COLUMN_BOARD_SUBMISSIONS_ENABLED') as boolean,
	FEATURE_COLUMN_BOARD_LINK_ELEMENT_ENABLED: Configuration.get('FEATURE_COLUMN_BOARD_LINK_ELEMENT_ENABLED') as boolean,
	FEATURE_COLUMN_BOARD_COLLABORATIVE_TEXT_EDITOR_ENABLED: Configuration.get(
		'FEATURE_COLUMN_BOARD_COLLABORATIVE_TEXT_EDITOR_ENABLED'
	) as boolean,
	FEATURE_COLUMN_BOARD_EXTERNAL_TOOLS_ENABLED: Configuration.get(
		'FEATURE_COLUMN_BOARD_EXTERNAL_TOOLS_ENABLED'
	) as boolean,
	FEATURE_COLUMN_BOARD_SHARE: Configuration.get('FEATURE_COLUMN_BOARD_SHARE') as boolean,
	FEATURE_COLUMN_BOARD_SOCKET_ENABLED: Configuration.get('FEATURE_COLUMN_BOARD_SOCKET_ENABLED') as boolean,
	FEATURE_COURSE_SHARE: Configuration.get('FEATURE_COURSE_SHARE') as boolean,
	FEATURE_LESSON_SHARE: Configuration.get('FEATURE_LESSON_SHARE') as boolean,
	FEATURE_TASK_SHARE: Configuration.get('FEATURE_TASK_SHARE') as boolean,
	FEATURE_BOARD_LAYOUT_ENABLED: Configuration.get('FEATURE_BOARD_LAYOUT_ENABLED') as boolean,
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
	GHOST_BASE_URL: Configuration.get('GHOST_BASE_URL') as string,
	ROCKETCHAT_SERVICE_ENABLED: Configuration.get('ROCKETCHAT_SERVICE_ENABLED') as boolean,
	JWT_LIFETIME: Configuration.get('JWT_LIFETIME') as string,
	JWT_SHOW_TIMEOUT_WARNING_SECONDS: Configuration.get('JWT_SHOW_TIMEOUT_WARNING_SECONDS') as number,
	JWT_TIMEOUT_SECONDS: Configuration.get('JWT_TIMEOUT_SECONDS') as number,
	JWT_LIFETIME_SUPPORT_SECONDS: Configuration.get('JWT_LIFETIME_SUPPORT_SECONDS') as number,
	JWT_EXTENDED_TIMEOUT_SECONDS: Configuration.get('JWT_EXTENDED_TIMEOUT_SECONDS') as number,

	// Node's process.env escapes newlines. We need to reverse it for the keys to work.
	// See: https://stackoverflow.com/questions/30400341/environment-variables-containing-newlines-in-node
	JWT_PRIVATE_KEY: (Configuration.get('JWT_PRIVATE_KEY') as string).replace(/\\n/g, '\n'),
	JWT_PUBLIC_KEY: (Configuration.get('JWT_PUBLIC_KEY') as string).replace(/\\n/g, '\n'),
	JWT_SIGNING_ALGORITHM: Configuration.get('JWT_SIGNING_ALGORITHM') as Algorithm,
	NOT_AUTHENTICATED_REDIRECT_URL: Configuration.get('NOT_AUTHENTICATED_REDIRECT_URL') as string,
	DOCUMENT_BASE_DIR: Configuration.get('DOCUMENT_BASE_DIR') as string,
	SC_THEME: Configuration.get('SC_THEME') as SchulcloudTheme,
	SC_TITLE: Configuration.get('SC_TITLE') as string,
	SC_DOMAIN: Configuration.get('SC_DOMAIN') as string,
	TRAINING_URL: Configuration.get('TRAINING_URL') as string,
	INCOMING_REQUEST_TIMEOUT: Configuration.get('INCOMING_REQUEST_TIMEOUT_API') as number,
	INCOMING_REQUEST_TIMEOUT_COPY_API: Configuration.get('INCOMING_REQUEST_TIMEOUT_COPY_API') as number,
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
	EXIT_ON_ERROR: Configuration.get('EXIT_ON_ERROR') as boolean,
	AVAILABLE_LANGUAGES: (Configuration.get('I18N__AVAILABLE_LANGUAGES') as string).split(',') as LanguageType[],
	NODE_ENV: Configuration.get('NODE_ENV') as NodeEnvType,
	LOGIN_BLOCK_TIME: Configuration.get('LOGIN_BLOCK_TIME') as number,
	TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE: Configuration.get(
		'TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE'
	) as boolean,
	TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION: Configuration.get(
		'TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION'
	) as string,
	FEATURE_COMMON_CARTRIDGE_COURSE_EXPORT_ENABLED: Configuration.get(
		'FEATURE_COMMON_CARTRIDGE_COURSE_EXPORT_ENABLED'
	) as boolean,
	GEOGEBRA_BASE_URL: Configuration.get('GEOGEBRA_BASE_URL') as string,
	FEATURE_IDENTITY_MANAGEMENT_ENABLED: Configuration.get('FEATURE_IDENTITY_MANAGEMENT_ENABLED') as boolean,
	FEATURE_IDENTITY_MANAGEMENT_STORE_ENABLED: Configuration.get('FEATURE_IDENTITY_MANAGEMENT_STORE_ENABLED') as boolean,
	FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED: Configuration.get('FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED') as boolean,
	FEATURE_TSP_SYNC_ENABLED: Configuration.get('FEATURE_TSP_SYNC_ENABLED') as boolean,
	STUDENT_TEAM_CREATION: Configuration.get('STUDENT_TEAM_CREATION') as string,
	SYNCHRONIZATION_CHUNK: Configuration.get('SYNCHRONIZATION_CHUNK') as number,
	// parse [<description>:]<token>,[<description>:]<token>... and  discard description
	BLOCKLIST_OF_EMAIL_DOMAINS: (Configuration.get('BLOCKLIST_OF_EMAIL_DOMAINS') as string)
		.split(',')
		.map((domain) => domain.trim()),
	TLDRAW__WEBSOCKET_URL: Configuration.get('TLDRAW__WEBSOCKET_URL') as string,
	TLDRAW__ASSETS_ENABLED: Configuration.get('TLDRAW__ASSETS_ENABLED') as boolean,
	TLDRAW__ASSETS_MAX_SIZE_BYTES: Configuration.get('TLDRAW__ASSETS_MAX_SIZE_BYTES') as number,
	TLDRAW__ASSETS_ALLOWED_MIME_TYPES_LIST: (Configuration.get('TLDRAW__ASSETS_ALLOWED_MIME_TYPES_LIST') as string).split(
		','
	),
	FEATURE_TLDRAW_ENABLED: Configuration.get('FEATURE_TLDRAW_ENABLED') as boolean,
	FEATURE_NEW_SCHOOL_ADMINISTRATION_PAGE_AS_DEFAULT_ENABLED: Configuration.get(
		'FEATURE_NEW_SCHOOL_ADMINISTRATION_PAGE_AS_DEFAULT_ENABLED'
	) as boolean,
	MIGRATION_END_GRACE_PERIOD_MS: Configuration.get('MIGRATION_END_GRACE_PERIOD_MS') as number,
	FEATURE_SHOW_OUTDATED_USERS: Configuration.get('FEATURE_SHOW_OUTDATED_USERS') as boolean,
	FEATURE_ENABLE_LDAP_SYNC_DURING_MIGRATION: Configuration.get('FEATURE_ENABLE_LDAP_SYNC_DURING_MIGRATION') as boolean,
	FEATURE_SHOW_NEW_CLASS_VIEW_ENABLED: Configuration.get('FEATURE_SHOW_NEW_CLASS_VIEW_ENABLED') as boolean,
	FEATURE_SHOW_NEW_ROOMS_VIEW_ENABLED: Configuration.get('FEATURE_SHOW_NEW_ROOMS_VIEW_ENABLED') as boolean,
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
	ETHERPAD__PAD_URI: Configuration.get('ETHERPAD__PAD_URI') as string,
	ETHERPAD__COOKIE_EXPIRES_SECONDS: Configuration.get('ETHERPAD__COOKIE_EXPIRES_SECONDS') as number,
	ETHERPAD__COOKIE_RELEASE_THRESHOLD: Configuration.get('ETHERPAD__COOKIE_RELEASE_THRESHOLD') as number,
	I18N__AVAILABLE_LANGUAGES: (Configuration.get('I18N__AVAILABLE_LANGUAGES') as string).split(',') as LanguageType[],
	I18N__DEFAULT_LANGUAGE: Configuration.get('I18N__DEFAULT_LANGUAGE') as unknown as LanguageType,
	I18N__FALLBACK_LANGUAGE: Configuration.get('I18N__FALLBACK_LANGUAGE') as unknown as LanguageType,
	I18N__DEFAULT_TIMEZONE: Configuration.get('I18N__DEFAULT_TIMEZONE') as Timezone,
	IMPORTUSER_SAVE_ALL_MATCHES_REQUEST_TIMEOUT_MS: Configuration.get(
		'IMPORTUSER_SAVE_ALL_MATCHES_REQUEST_TIMEOUT_MS'
	) as number,
	SCHULCONNEX_CLIENT__API_URL: Configuration.has('SCHULCONNEX_CLIENT__API_URL')
		? (Configuration.get('SCHULCONNEX_CLIENT__API_URL') as string)
		: undefined,
	SCHULCONNEX_CLIENT__TOKEN_ENDPOINT: Configuration.has('SCHULCONNEX_CLIENT__TOKEN_ENDPOINT')
		? (Configuration.get('SCHULCONNEX_CLIENT__TOKEN_ENDPOINT') as string)
		: undefined,
	SCHULCONNEX_CLIENT__CLIENT_ID: Configuration.has('SCHULCONNEX_CLIENT__CLIENT_ID')
		? (Configuration.get('SCHULCONNEX_CLIENT__CLIENT_ID') as string)
		: undefined,
	SCHULCONNEX_CLIENT__CLIENT_SECRET: Configuration.has('SCHULCONNEX_CLIENT__CLIENT_SECRET')
		? (Configuration.get('SCHULCONNEX_CLIENT__CLIENT_SECRET') as string)
		: undefined,
	SCHULCONNEX_CLIENT__PERSONEN_INFO_TIMEOUT_IN_MS: Configuration.get(
		'SCHULCONNEX_CLIENT__PERSONEN_INFO_TIMEOUT_IN_MS'
	) as number,
	SCHULCONNEX_CLIENT__POLICIES_INFO_TIMEOUT_IN_MS: Configuration.get(
		'SCHULCONNEX_CLIENT__POLICIES_INFO_TIMEOUT_IN_MS'
	) as number,
	FEATURE_SCHULCONNEX_COURSE_SYNC_ENABLED: Configuration.get('FEATURE_SCHULCONNEX_COURSE_SYNC_ENABLED') as boolean,
	...getTldrawClientConfig(),
	FEATURE_MEDIA_SHELF_ENABLED: Configuration.get('FEATURE_MEDIA_SHELF_ENABLED') as boolean,
	FEATURE_OTHER_GROUPUSERS_PROVISIONING_ENABLED: Configuration.get(
		'FEATURE_OTHER_GROUPUSERS_PROVISIONING_ENABLED'
	) as boolean,
	ALERT_CACHE_INTERVAL_MIN: Configuration.get('ALERT_CACHE_INTERVAL_MIN') as number,
	FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED: Configuration.get('FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED') as boolean,
	PROVISIONING_SCHULCONNEX_POLICIES_INFO_URL: Configuration.get('PROVISIONING_SCHULCONNEX_POLICIES_INFO_URL') as string,
	BOARD_COLLABORATION_URI: Configuration.get('BOARD_COLLABORATION_URI') as string,
	FEATURE_CTL_TOOLS_TAB_ENABLED: Configuration.get('FEATURE_CTL_TOOLS_TAB_ENABLED') as boolean,
	FEATURE_LTI_TOOLS_TAB_ENABLED: Configuration.get('FEATURE_LTI_TOOLS_TAB_ENABLED') as boolean,
	CTL_TOOLS__EXTERNAL_TOOL_MAX_LOGO_SIZE_IN_BYTES: Configuration.get(
		'CTL_TOOLS__EXTERNAL_TOOL_MAX_LOGO_SIZE_IN_BYTES'
	) as number,
	CTL_TOOLS_BACKEND_URL: Configuration.get('PUBLIC_BACKEND_URL') as string,
	FEATURE_CTL_TOOLS_COPY_ENABLED: Configuration.get('FEATURE_CTL_TOOLS_COPY_ENABLED') as boolean,
	FEATURE_PREFERRED_CTL_TOOLS_ENABLED: Configuration.get('FEATURE_PREFERRED_CTL_TOOLS_ENABLED') as boolean,
	CTL_TOOLS_RELOAD_TIME_MS: Configuration.get('CTL_TOOLS_RELOAD_TIME_MS') as number,
	HOST: Configuration.get('HOST') as string,
	FILES_STORAGE__SERVICE_BASE_URL: Configuration.get('FILES_STORAGE__SERVICE_BASE_URL') as string,
	FEATURE_VIDEOCONFERENCE_ENABLED: Configuration.get('FEATURE_VIDEOCONFERENCE_ENABLED') as boolean,
	VIDEOCONFERENCE_HOST: Configuration.get('VIDEOCONFERENCE_HOST') as string,
	VIDEOCONFERENCE_SALT: Configuration.get('VIDEOCONFERENCE_SALT') as string,
	VIDEOCONFERENCE_DEFAULT_PRESENTATION: Configuration.get('VIDEOCONFERENCE_DEFAULT_PRESENTATION') as string,
	FEATURE_USER_MIGRATION_ENABLED: Configuration.get('FEATURE_USER_MIGRATION_ENABLED') as boolean,
	FEATURE_USER_MIGRATION_SYSTEM_ID: Configuration.get('FEATURE_USER_MIGRATION_SYSTEM_ID') as string,
	FEATURE_MIGRATION_WIZARD_WITH_USER_LOGIN_MIGRATION: Configuration.get(
		'FEATURE_MIGRATION_WIZARD_WITH_USER_LOGIN_MIGRATION'
	) as boolean,
	FEATURE_SANIS_GROUP_PROVISIONING_ENABLED: Configuration.get('FEATURE_SANIS_GROUP_PROVISIONING_ENABLED') as boolean,
	FEATURE_AI_TUTOR_ENABLED: Configuration.get('FEATURE_AI_TUTOR_ENABLED') as boolean,
	FEATURE_ROOMS_ENABLED: Configuration.get('FEATURE_ROOMS_ENABLED') as boolean,
	TSP_API_CLIENT_BASE_URL: Configuration.get('TSP_API_CLIENT_BASE_URL') as string,
	TSP_API_CLIENT_TOKEN_LIFETIME_MS: Configuration.get('TSP_API_CLIENT_TOKEN_LIFETIME_MS') as number,
	TSP_SYNC_SCHOOL_LIMIT: Configuration.get('TSP_SYNC_SCHOOL_LIMIT') as number,
	TSP_SYNC_SCHOOL_DAYS_TO_FETCH: Configuration.get('TSP_SYNC_SCHOOL_DAYS_TO_FETCH') as number,
	TSP_SYNC_DATA_LIMIT: Configuration.get('TSP_SYNC_DATA_LIMIT') as number,
	TSP_SYNC_DATA_DAYS_TO_FETCH: Configuration.get('TSP_SYNC_DATA_DAYS_TO_FETCH') as number,
	TSP_SYNC_MIGRATION_LIMIT: Configuration.get('TSP_SYNC_MIGRATION_LIMIT') as number,
	FEATURE_TSP_MIGRATION_ENABLED: Configuration.get('FEATURE_TSP_MIGRATION_ENABLED') as boolean,
	ROCKET_CHAT_URI: Configuration.get('ROCKET_CHAT_URI') as string,
	ROCKET_CHAT_ADMIN_ID: Configuration.get('ROCKET_CHAT_ADMIN_ID') as string,
	ROCKET_CHAT_ADMIN_TOKEN: Configuration.get('ROCKET_CHAT_ADMIN_TOKEN') as string,
	ROCKET_CHAT_ADMIN_USER: Configuration.get('ROCKET_CHAT_ADMIN_USER') as string,
	ROCKET_CHAT_ADMIN_PASSWORD: Configuration.get('ROCKET_CHAT_ADMIN_PASSWORD') as string,
	CTL_TOOLS__PREFERRED_TOOLS_LIMIT: Configuration.get('CTL_TOOLS__PREFERRED_TOOLS_LIMIT') as number,
	AES_KEY: Configuration.get('AES_KEY') as string,
	FEATURE_OAUTH_LOGIN: Configuration.get('FEATURE_OAUTH_LOGIN') as boolean,
	FEATURE_EXTERNAL_SYSTEM_LOGOUT_ENABLED: Configuration.get('FEATURE_EXTERNAL_SYSTEM_LOGOUT_ENABLED') as boolean,
};

export const serverConfig = () => config;
export const SERVER_CONFIG_TOKEN = 'SERVER_CONFIG_TOKEN';
