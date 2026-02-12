import type { CoreModuleConfig } from '@core/core.config';
import { Configuration } from '@hpi-schul-cloud/commons';
import type { JwtAuthGuardConfig } from '@infra/auth-guard';
import type { EncryptionConfig } from '@infra/encryption/encryption.config';
import type { FilesStorageClientConfig } from '@infra/files-storage-client';
import type { IdentityManagementConfig } from '@infra/identity-management';
import type { MailConfig } from '@infra/mail/interfaces/mail-config';
import type { SchulconnexClientConfig } from '@infra/schulconnex-client';
import type { TspSyncConfig } from '@infra/sync';
import type { TspClientConfig } from '@infra/tsp-client';
import { ValkeyMode } from '@infra/valkey-client';
import type { AccountConfig } from '@modules/account';
import type { AlertConfig } from '@modules/alert';
import type { AuthenticationConfig } from '@modules/authentication';
import type { BoardConfig, MediaBoardConfig } from '@modules/board';
import type { CollaborativeTextEditorConfig } from '@modules/collaborative-text-editor';
import type { FilesStorageClientConfig as FilesMetadataClientConfig } from '@modules/files-storage-client';
import type { LearnroomConfig } from '@modules/learnroom';
import type { LessonConfig } from '@modules/lesson';
import type { ManagementSeedDataConfig } from '@modules/management';
import type { OauthConfig } from '@modules/oauth';
import type { ProvisioningConfig } from '@modules/provisioning';
import type { RocketChatUserConfig } from '@modules/rocketchat-user';
import type { RoomConfig } from '@modules/room';
import type { SchoolConfig } from '@modules/school';
import type { SharingConfig } from '@modules/sharing';
import type { ShdConfig } from '@modules/shd';
import type { ToolConfig } from '@modules/tool';
import type { UserConfig } from '@modules/user';
import type { UserImportConfig } from '@modules/user-import';
import type { UserLoginMigrationConfig } from '@modules/user-login-migration';
import type { LanguageType } from '@shared/domain/interface';
import type { SchulcloudTheme } from '@shared/domain/types';
import type { Algorithm } from 'jsonwebtoken';
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
		FilesMetadataClientConfig,
		AccountConfig,
		IdentityManagementConfig,
		SchoolConfig,
		MailConfig,
		JwtAuthGuardConfig,
		RocketChatUserConfig,
		LearnroomConfig,
		AuthenticationConfig,
		ToolConfig,
		UserLoginMigrationConfig,
		LessonConfig,
		BoardConfig,
		MediaBoardConfig,
		SharingConfig,
		UserImportConfig,
		SchulconnexClientConfig,
		CollaborativeTextEditorConfig,
		ProvisioningConfig,
		RoomConfig,
		UserImportConfig,
		TspClientConfig,
		TspSyncConfig,
		AlertConfig,
		ShdConfig,
		OauthConfig,
		EncryptionConfig,
		FilesStorageClientConfig,
		ManagementSeedDataConfig {
	NODE_ENV: NodeEnvType;
	SC_DOMAIN: string;
	HOST: string;
	ACCESSIBILITY_REPORT_EMAIL: string;
	SC_CONTACT_EMAIL: string;
	SC_CONTACT_EMAIL_SUBJECT: string;
	ADMIN_TABLES_DISPLAY_CONSENT_COLUMN: boolean;
	ALERT_STATUS_URL: string | null;
	CALENDAR_SERVICE_ENABLED: boolean;
	FEATURE_ES_COLLECTIONS_ENABLED: boolean;
	FEATURE_TEAMS_ENABLED: boolean;
	FEATURE_LERNSTORE_ENABLED: boolean;
	FEATURE_FWU_CONTENT_ENABLED: boolean;
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
	FEATURE_COLUMN_BOARD_FILE_FOLDER_ENABLED: boolean;
	FEATURE_COLUMN_BOARD_H5P_ENABLED: boolean;
	FEATURE_COLUMN_BOARD_COLLABORA_ENABLED: boolean;
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
	FEATURE_ENABLE_LDAP_SYNC_DURING_MIGRATION: boolean;
	FEATURE_TLDRAW_ENABLED: boolean;
	I18N__AVAILABLE_LANGUAGES: LanguageType[];
	I18N__DEFAULT_LANGUAGE: LanguageType;
	I18N__FALLBACK_LANGUAGE: LanguageType;
	I18N__DEFAULT_TIMEZONE: Timezone;
	BOARD_COLLABORATION_URI: string;
	FEATURE_AI_TUTOR_ENABLED: boolean;
	FEATURE_ADMINISTRATE_ROOMS_ENABLED: boolean;
	FEATURE_BOARD_READERS_CAN_EDIT_TOGGLE: boolean;
	FEATURE_EXTERNAL_PERSON_REGISTRATION_ENABLED: boolean;
	FEATURE_ROOM_COPY_ENABLED: boolean;
	FEATURE_ROOM_SHARE: boolean;
	FEATURE_ROOM_ADD_EXTERNAL_PERSONS_ENABLED: boolean;
	FEATURE_ROOM_REGISTER_EXTERNAL_PERSONS_ENABLED: boolean;
	FEATURE_ROOM_LINK_INVITATION_EXTERNAL_PERSONS_ENABLED: boolean;
	FEATURE_TSP_SYNC_ENABLED: boolean;
	FEATURE_VIDIS_MEDIA_ACTIVATIONS_ENABLED: boolean;
	LICENSE_SUMMARY_URL: string | undefined;
	ROOM_MEMBER_INFO_URL: string | null;
	ROOM_MEMBER_ADD_EXTERNAL_PERSON_REQUIREMENTS_URL: string | null;
}

const config: ServerConfig = {
	ACCESSIBILITY_REPORT_EMAIL: Configuration.get('ACCESSIBILITY_REPORT_EMAIL') as string,
	SC_CONTACT_EMAIL: Configuration.get('SC_CONTACT_EMAIL') as string,
	SC_CONTACT_EMAIL_SUBJECT: Configuration.get('SC_CONTACT_EMAIL_SUBJECT') as string,
	ADMIN_TABLES_DISPLAY_CONSENT_COLUMN: Configuration.get('ADMIN_TABLES_DISPLAY_CONSENT_COLUMN') as boolean,
	ALERT_STATUS_URL:
		Configuration.get('ALERT_STATUS_URL') === null
			? (Configuration.get('ALERT_STATUS_URL') as null)
			: (Configuration.get('ALERT_STATUS_URL') as string),
	CALENDAR_SERVICE_ENABLED: Configuration.get('CALENDAR_SERVICE_ENABLED') as boolean,
	FEATURE_ES_COLLECTIONS_ENABLED: Configuration.get('FEATURE_ES_COLLECTIONS_ENABLED') as boolean,
	FEATURE_JWT_EXTENDED_TIMEOUT_ENABLED: Configuration.get('FEATURE_JWT_EXTENDED_TIMEOUT_ENABLED') as boolean,
	FEATURE_TEAMS_ENABLED: Configuration.get('FEATURE_TEAMS_ENABLED') as boolean,
	FEATURE_LERNSTORE_ENABLED: Configuration.get('FEATURE_LERNSTORE_ENABLED') as boolean,
	FEATURE_FWU_CONTENT_ENABLED: Configuration.get('FEATURE_FWU_CONTENT_ENABLED') as boolean,
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
	FEATURE_COLUMN_BOARD_FILE_FOLDER_ENABLED: Configuration.get('FEATURE_COLUMN_BOARD_FILE_FOLDER_ENABLED') as boolean,
	FEATURE_COLUMN_BOARD_H5P_ENABLED: Configuration.get('FEATURE_COLUMN_BOARD_H5P_ENABLED') as boolean,
	FEATURE_COLUMN_BOARD_COLLABORA_ENABLED: Configuration.get('FEATURE_COLUMN_BOARD_COLLABORA_ENABLED') as boolean,
	FEATURE_COURSE_SHARE: Configuration.get('FEATURE_COURSE_SHARE') as boolean,
	FEATURE_LESSON_SHARE: Configuration.get('FEATURE_LESSON_SHARE') as boolean,
	FEATURE_TASK_SHARE: Configuration.get('FEATURE_TASK_SHARE') as boolean,
	FEATURE_BOARD_LAYOUT_ENABLED: Configuration.get('FEATURE_BOARD_LAYOUT_ENABLED') as boolean,
	FEATURE_LOGIN_LINK_ENABLED: Configuration.get('FEATURE_LOGIN_LINK_ENABLED') as boolean,
	FEATURE_COPY_SERVICE_ENABLED: Configuration.get('FEATURE_COPY_SERVICE_ENABLED') as boolean,
	FEATURE_CONSENT_NECESSARY: Configuration.get('FEATURE_CONSENT_NECESSARY') as boolean,
	FEATURE_USER_LOGIN_MIGRATION_ENABLED: Configuration.get('FEATURE_USER_LOGIN_MIGRATION_ENABLED') as boolean,
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
	SC_SHORTNAME: Configuration.get('SC_SHORTNAME') as string,
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
	// parse [<description>:]<token>,[<description>:]<token>... and  discard description
	BLOCKLIST_OF_EMAIL_DOMAINS: (Configuration.get('BLOCKLIST_OF_EMAIL_DOMAINS') as string)
		.split(',')
		.map((domain) => domain.trim()),
	FEATURE_TLDRAW_ENABLED: Configuration.get('FEATURE_TLDRAW_ENABLED') as boolean,
	MIGRATION_END_GRACE_PERIOD_MS: Configuration.get('MIGRATION_END_GRACE_PERIOD_MS') as number,
	FEATURE_SHOW_OUTDATED_USERS: Configuration.get('FEATURE_SHOW_OUTDATED_USERS') as boolean,
	FEATURE_ENABLE_LDAP_SYNC_DURING_MIGRATION: Configuration.get('FEATURE_ENABLE_LDAP_SYNC_DURING_MIGRATION') as boolean,
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
	SCHULCONNEX_CLIENT__PERSON_INFO_TIMEOUT_IN_MS: Configuration.get(
		'SCHULCONNEX_CLIENT__PERSON_INFO_TIMEOUT_IN_MS'
	) as number,
	SCHULCONNEX_CLIENT__PERSONEN_INFO_TIMEOUT_IN_MS: Configuration.get(
		'SCHULCONNEX_CLIENT__PERSONEN_INFO_TIMEOUT_IN_MS'
	) as number,
	SCHULCONNEX_CLIENT__POLICIES_INFO_TIMEOUT_IN_MS: Configuration.get(
		'SCHULCONNEX_CLIENT__POLICIES_INFO_TIMEOUT_IN_MS'
	) as number,
	PROVISIONING_SCHULCONNEX_GROUP_USERS_LIMIT: Configuration.has('PROVISIONING_SCHULCONNEX_GROUP_USERS_LIMIT')
		? (Configuration.get('PROVISIONING_SCHULCONNEX_GROUP_USERS_LIMIT') as number)
		: undefined,
	FEATURE_SCHULCONNEX_COURSE_SYNC_ENABLED: Configuration.get('FEATURE_SCHULCONNEX_COURSE_SYNC_ENABLED') as boolean,
	FEATURE_MEDIA_SHELF_ENABLED: Configuration.get('FEATURE_MEDIA_SHELF_ENABLED') as boolean,
	FEATURE_OTHER_GROUPUSERS_PROVISIONING_ENABLED: Configuration.get(
		'FEATURE_OTHER_GROUPUSERS_PROVISIONING_ENABLED'
	) as boolean,
	ALERT_CACHE_INTERVAL_MIN: Configuration.get('ALERT_CACHE_INTERVAL_MIN') as number,
	FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED: Configuration.get('FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED') as boolean,
	PROVISIONING_SCHULCONNEX_POLICIES_INFO_URL: Configuration.get('PROVISIONING_SCHULCONNEX_POLICIES_INFO_URL') as string,
	BOARD_COLLABORATION_URI: Configuration.get('BOARD_COLLABORATION_URI') as string,
	CTL_TOOLS__EXTERNAL_TOOL_MAX_LOGO_SIZE_IN_BYTES: Configuration.get(
		'CTL_TOOLS__EXTERNAL_TOOL_MAX_LOGO_SIZE_IN_BYTES'
	) as number,
	CTL_TOOLS_BACKEND_URL: Configuration.get('PUBLIC_BACKEND_URL') as string,
	FEATURE_CTL_TOOLS_COPY_ENABLED: Configuration.get('FEATURE_CTL_TOOLS_COPY_ENABLED') as boolean,
	FEATURE_PREFERRED_CTL_TOOLS_ENABLED: Configuration.get('FEATURE_PREFERRED_CTL_TOOLS_ENABLED') as boolean,
	CTL_TOOLS_RELOAD_TIME_MS: Configuration.get('CTL_TOOLS_RELOAD_TIME_MS') as number,
	HOST: Configuration.get('HOST') as string,
	FILES_STORAGE__SERVICE_BASE_URL: Configuration.get('FILES_STORAGE__SERVICE_BASE_URL') as string,
	FEATURE_USER_MIGRATION_ENABLED: Configuration.get('FEATURE_USER_MIGRATION_ENABLED') as boolean,
	FEATURE_USER_MIGRATION_SYSTEM_ID: Configuration.get('FEATURE_USER_MIGRATION_SYSTEM_ID') as string,
	FEATURE_MIGRATION_WIZARD_WITH_USER_LOGIN_MIGRATION: Configuration.get(
		'FEATURE_MIGRATION_WIZARD_WITH_USER_LOGIN_MIGRATION'
	) as boolean,
	FEATURE_SCHULCONNEX_GROUP_PROVISIONING_ENABLED: Configuration.get(
		'FEATURE_SCHULCONNEX_GROUP_PROVISIONING_ENABLED'
	) as boolean,
	FEATURE_AI_TUTOR_ENABLED: Configuration.get('FEATURE_AI_TUTOR_ENABLED') as boolean,
	FEATURE_ADMINISTRATE_ROOMS_ENABLED: Configuration.get('FEATURE_ADMINISTRATE_ROOMS_ENABLED') as boolean,
	FEATURE_BOARD_READERS_CAN_EDIT_TOGGLE: Configuration.get('FEATURE_BOARD_READERS_CAN_EDIT_TOGGLE') as boolean,
	FEATURE_EXTERNAL_PERSON_REGISTRATION_ENABLED: Configuration.get(
		'FEATURE_EXTERNAL_PERSON_REGISTRATION_ENABLED'
	) as boolean,
	FEATURE_ROOM_COPY_ENABLED: Configuration.get('FEATURE_ROOM_COPY_ENABLED') as boolean,
	FEATURE_ROOM_SHARE: Configuration.get('FEATURE_ROOM_SHARE') as boolean,
	FEATURE_ROOM_ADD_EXTERNAL_PERSONS_ENABLED: Configuration.get('FEATURE_ROOM_ADD_EXTERNAL_PERSONS_ENABLED') as boolean,
	FEATURE_ROOM_REGISTER_EXTERNAL_PERSONS_ENABLED: Configuration.get(
		'FEATURE_ROOM_REGISTER_EXTERNAL_PERSONS_ENABLED'
	) as boolean,
	FEATURE_ROOM_LINK_INVITATION_EXTERNAL_PERSONS_ENABLED: Configuration.get(
		'FEATURE_ROOM_LINK_INVITATION_EXTERNAL_PERSONS_ENABLED'
	) as boolean,
	TSP_API_CLIENT_BASE_URL: Configuration.get('TSP_API_CLIENT_BASE_URL') as string,
	TSP_API_CLIENT_TOKEN_LIFETIME_MS: Configuration.get('TSP_API_CLIENT_TOKEN_LIFETIME_MS') as number,
	TSP_SYNC_SCHOOL_LIMIT: Configuration.get('TSP_SYNC_SCHOOL_LIMIT') as number,
	TSP_SYNC_SCHOOL_DAYS_TO_FETCH: Configuration.get('TSP_SYNC_SCHOOL_DAYS_TO_FETCH') as number,
	TSP_SYNC_DATA_LIMIT: Configuration.get('TSP_SYNC_DATA_LIMIT') as number,
	TSP_SYNC_DATA_DAYS_TO_FETCH: Configuration.get('TSP_SYNC_DATA_DAYS_TO_FETCH') as number,
	ROCKET_CHAT_URI: Configuration.get('ROCKET_CHAT_URI') as string,
	ROCKET_CHAT_ADMIN_ID: Configuration.get('ROCKET_CHAT_ADMIN_ID') as string,
	ROCKET_CHAT_ADMIN_TOKEN: Configuration.get('ROCKET_CHAT_ADMIN_TOKEN') as string,
	ROCKET_CHAT_ADMIN_USER: Configuration.get('ROCKET_CHAT_ADMIN_USER') as string,
	ROCKET_CHAT_ADMIN_PASSWORD: Configuration.get('ROCKET_CHAT_ADMIN_PASSWORD') as string,
	CTL_TOOLS__PREFERRED_TOOLS_LIMIT: Configuration.get('CTL_TOOLS__PREFERRED_TOOLS_LIMIT') as number,
	AES_KEY: Configuration.get('AES_KEY') as string,
	FEATURE_OAUTH_LOGIN: Configuration.get('FEATURE_OAUTH_LOGIN') as boolean,
	FEATURE_EXTERNAL_SYSTEM_LOGOUT_ENABLED: Configuration.get('FEATURE_EXTERNAL_SYSTEM_LOGOUT_ENABLED') as boolean,
	PUBLIC_BACKEND_URL: Configuration.get('PUBLIC_BACKEND_URL') as string,
	FEATURE_VIDIS_MEDIA_ACTIVATIONS_ENABLED: Configuration.get('FEATURE_VIDIS_MEDIA_ACTIVATIONS_ENABLED') as boolean,
	MEDIA_SOURCE_VIDIS_USERNAME: Configuration.has('MEDIA_SOURCE_VIDIS_USERNAME')
		? (Configuration.get('MEDIA_SOURCE_VIDIS_USERNAME') as string)
		: undefined,
	MEDIA_SOURCE_VIDIS_PASSWORD: Configuration.has('MEDIA_SOURCE_VIDIS_PASSWORD')
		? (Configuration.get('MEDIA_SOURCE_VIDIS_PASSWORD') as string)
		: undefined,
	MEDIA_SOURCE_BILO_CLIENT_ID: Configuration.has('MEDIA_SOURCE_BILO_CLIENT_ID')
		? (Configuration.get('MEDIA_SOURCE_BILO_CLIENT_ID') as string)
		: undefined,
	MEDIA_SOURCE_BILO_CLIENT_SECRET: Configuration.has('MEDIA_SOURCE_BILO_CLIENT_SECRET')
		? (Configuration.get('MEDIA_SOURCE_BILO_CLIENT_SECRET') as string)
		: undefined,
	SCHULCONNEX_CLIENT_ID: Configuration.has('SCHULCONNEX_CLIENT_ID')
		? (Configuration.get('SCHULCONNEX_CLIENT_ID') as string)
		: undefined,
	SCHULCONNEX_CLIENT_SECRET: Configuration.has('SCHULCONNEX_CLIENT_SECRET')
		? (Configuration.get('SCHULCONNEX_CLIENT_SECRET') as string)
		: undefined,
	LICENSE_SUMMARY_URL: Configuration.has('LICENSE_SUMMARY_URL')
		? (Configuration.get('LICENSE_SUMMARY_URL') as string)
		: undefined,
	ROOM_MEMBER_INFO_URL:
		Configuration.get('ROOM_MEMBER_INFO_URL') === null
			? (Configuration.get('ROOM_MEMBER_INFO_URL') as null)
			: (Configuration.get('ROOM_MEMBER_INFO_URL') as string),
	ROOM_MEMBER_ADD_EXTERNAL_PERSON_REQUIREMENTS_URL:
		Configuration.get('ROOM_MEMBER_ADD_EXTERNAL_PERSON_REQUIREMENTS_URL') === null
			? (Configuration.get('ROOM_MEMBER_ADD_EXTERNAL_PERSON_REQUIREMENTS_URL') as null)
			: (Configuration.get('ROOM_MEMBER_ADD_EXTERNAL_PERSON_REQUIREMENTS_URL') as string),
	SCHULCONNEX_COURSE_SYNC_HISTORY_EXPIRATION_SECONDS: Configuration.get(
		'SCHULCONNEX_COURSE_SYNC_HISTORY_EXPIRATION_SECONDS'
	) as number,
	SESSION_VALKEY__MODE: Configuration.get('SESSION_VALKEY__MODE') as ValkeyMode,
	SESSION_VALKEY__URI: Configuration.has('SESSION_VALKEY__URI')
		? (Configuration.get('SESSION_VALKEY__URI') as string)
		: undefined,
	SESSION_VALKEY__SENTINEL_NAME: Configuration.has('SESSION_VALKEY__SENTINEL_NAME')
		? (Configuration.get('SESSION_VALKEY__SENTINEL_NAME') as string)
		: undefined,
	SESSION_VALKEY__SENTINEL_PASSWORD: Configuration.has('SESSION_VALKEY__SENTINEL_PASSWORD')
		? (Configuration.get('SESSION_VALKEY__SENTINEL_PASSWORD') as string)
		: undefined,
	SESSION_VALKEY__SENTINEL_SERVICE_NAME: Configuration.has('SESSION_VALKEY__SENTINEL_SERVICE_NAME')
		? (Configuration.get('SESSION_VALKEY__SENTINEL_SERVICE_NAME') as string)
		: undefined,
	NEXTCLOUD_SOCIALLOGIN_OIDC_INTERNAL_NAME: Configuration.has('NEXTCLOUD_SOCIALLOGIN_OIDC_INTERNAL_NAME')
		? (Configuration.get('NEXTCLOUD_SOCIALLOGIN_OIDC_INTERNAL_NAME') as string)
		: undefined,
	NEXTCLOUD_BASE_URL: Configuration.has('NEXTCLOUD_BASE_URL')
		? (Configuration.get('NEXTCLOUD_BASE_URL') as string)
		: undefined,
	NEXTCLOUD_CLIENT_ID: Configuration.has('NEXTCLOUD_CLIENT_ID')
		? (Configuration.get('NEXTCLOUD_CLIENT_ID') as string)
		: undefined,
	NEXTCLOUD_CLIENT_SECRET: Configuration.has('NEXTCLOUD_CLIENT_SECRET')
		? (Configuration.get('NEXTCLOUD_CLIENT_SECRET') as string)
		: undefined,
	NEXTCLOUD_SCOPES: Configuration.has('NEXTCLOUD_SCOPES')
		? (Configuration.get('NEXTCLOUD_SCOPES') as string)
		: undefined,
	CTL_SEED_SECRET_ONLINE_DIA_MATHE: Configuration.has('CTL_SEED_SECRET_ONLINE_DIA_MATHE')
		? (Configuration.get('CTL_SEED_SECRET_ONLINE_DIA_MATHE') as string)
		: undefined,
	CTL_SEED_SECRET_ONLINE_DIA_DEUTSCH: Configuration.has('CTL_SEED_SECRET_ONLINE_DIA_DEUTSCH')
		? (Configuration.get('CTL_SEED_SECRET_ONLINE_DIA_DEUTSCH') as string)
		: undefined,
	CTL_SEED_SECRET_MERLIN: Configuration.has('CTL_SEED_SECRET_MERLIN')
		? (Configuration.get('CTL_SEED_SECRET_MERLIN') as string)
		: undefined,
};

export const serverConfig = (): ServerConfig => config;
export const SERVER_CONFIG_TOKEN = 'SERVER_CONFIG_TOKEN';
