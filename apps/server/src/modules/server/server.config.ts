import type { CoreModuleConfig } from '@core/core.config';
import { Configuration } from '@hpi-schul-cloud/commons';
import type { ManagementSeedDataConfig } from '@modules/management';
import type { LanguageType } from '@shared/domain/interface';
import type { SchulcloudTheme } from '@shared/domain/types';
import type { Timezone } from './types/timezone.enum';

export enum NodeEnvType {
	TEST = 'test',
	DEVELOPMENT = 'development',
	PRODUCTION = 'production',
	MIGRATION = 'migration',
}

// Environment keys should be added over configs from modules, directly adding is only allow for legacy stuff
// Maye some of them must be outsourced to additional microservice config endpoints.
export interface ServerConfig extends CoreModuleConfig, ManagementSeedDataConfig {
	NODE_ENV: NodeEnvType;
	SC_DOMAIN: string;
	HOST: string;
	ACCESSIBILITY_REPORT_EMAIL: string;
	SC_CONTACT_EMAIL: string;
	SC_CONTACT_EMAIL_SUBJECT: string;
	ADMIN_TABLES_DISPLAY_CONSENT_COLUMN: boolean;
	CALENDAR_SERVICE_ENABLED: boolean;
	FEATURE_ES_COLLECTIONS_ENABLED: boolean;
	FEATURE_EXTENSIONS_ENABLED: boolean;
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
	FEATURE_COLUMN_BOARD_COLLABORATIVE_TEXT_EDITOR_ENABLED: boolean;
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
	I18N__DEFAULT_LANGUAGE: LanguageType;
	I18N__FALLBACK_LANGUAGE: LanguageType;
	I18N__DEFAULT_TIMEZONE: Timezone;
	BOARD_COLLABORATION_URI: string;
	FEATURE_AI_TUTOR_ENABLED: boolean;
	FEATURE_ROOM_ADD_EXTERNAL_PERSONS_ENABLED: boolean;
	FEATURE_ROOM_REGISTER_EXTERNAL_PERSONS_ENABLED: boolean;
	LICENSE_SUMMARY_URL: string | undefined;
	ROOM_MEMBER_INFO_URL: string | null;
	STUDENT_TEAM_CREATION: string;
	ROCKET_CHAT_URI: string;
	ROCKET_CHAT_ADMIN_ID: string;
	ROCKET_CHAT_ADMIN_TOKEN: string;
	SCHULCONNEX_CLIENT__PERSONEN_INFO_TIMEOUT_IN_MS: number;
	INCOMING_REQUEST_TIMEOUT_COPY_API: number;
	IMPORTUSER_SAVE_ALL_MATCHES_REQUEST_TIMEOUT_MS: number;
}

const config: ServerConfig = {
	ACCESSIBILITY_REPORT_EMAIL: Configuration.get('ACCESSIBILITY_REPORT_EMAIL') as string,
	SC_CONTACT_EMAIL: Configuration.get('SC_CONTACT_EMAIL') as string,
	SC_CONTACT_EMAIL_SUBJECT: Configuration.get('SC_CONTACT_EMAIL_SUBJECT') as string,
	ADMIN_TABLES_DISPLAY_CONSENT_COLUMN: Configuration.get('ADMIN_TABLES_DISPLAY_CONSENT_COLUMN') as boolean,
	CALENDAR_SERVICE_ENABLED: Configuration.get('CALENDAR_SERVICE_ENABLED') as boolean,
	FEATURE_ES_COLLECTIONS_ENABLED: Configuration.get('FEATURE_ES_COLLECTIONS_ENABLED') as boolean,
	FEATURE_EXTENSIONS_ENABLED: Configuration.get('FEATURE_EXTENSIONS_ENABLED') as boolean,
	FEATURE_TEAMS_ENABLED: Configuration.get('FEATURE_TEAMS_ENABLED') as boolean,
	FEATURE_LERNSTORE_ENABLED: Configuration.get('FEATURE_LERNSTORE_ENABLED') as boolean,
	FEATURE_FWU_CONTENT_ENABLED: Configuration.get('FEATURE_FWU_CONTENT_ENABLED') as boolean,
	FEATURE_ADMIN_TOGGLE_STUDENT_LERNSTORE_VIEW_ENABLED: Configuration.get(
		'FEATURE_ADMIN_TOGGLE_STUDENT_LERNSTORE_VIEW_ENABLED'
	) as boolean,
	FEATURE_COLUMN_BOARD_SUBMISSIONS_ENABLED: Configuration.get('FEATURE_COLUMN_BOARD_SUBMISSIONS_ENABLED') as boolean,
	FEATURE_COLUMN_BOARD_LINK_ELEMENT_ENABLED: Configuration.get('FEATURE_COLUMN_BOARD_LINK_ELEMENT_ENABLED') as boolean,
	FEATURE_COLUMN_BOARD_COLLABORATIVE_TEXT_EDITOR_ENABLED: Configuration.get(
		'FEATURE_COLUMN_BOARD_COLLABORATIVE_TEXT_EDITOR_ENABLED'
	) as boolean,
	FEATURE_COLUMN_BOARD_SOCKET_ENABLED: Configuration.get('FEATURE_COLUMN_BOARD_SOCKET_ENABLED') as boolean,
	FEATURE_COLUMN_BOARD_FILE_FOLDER_ENABLED: Configuration.get('FEATURE_COLUMN_BOARD_FILE_FOLDER_ENABLED') as boolean,
	FEATURE_COLUMN_BOARD_H5P_ENABLED: Configuration.get('FEATURE_COLUMN_BOARD_H5P_ENABLED') as boolean,
	FEATURE_COLUMN_BOARD_COLLABORA_ENABLED: Configuration.get('FEATURE_COLUMN_BOARD_COLLABORA_ENABLED') as boolean,
	FEATURE_BOARD_LAYOUT_ENABLED: Configuration.get('FEATURE_BOARD_LAYOUT_ENABLED') as boolean,
	FEATURE_CONSENT_NECESSARY: Configuration.get('FEATURE_CONSENT_NECESSARY') as boolean,
	TEACHER_STUDENT_VISIBILITY__IS_ENABLED_BY_DEFAULT: Configuration.get(
		'TEACHER_STUDENT_VISIBILITY__IS_ENABLED_BY_DEFAULT'
	) as boolean,
	TEACHER_STUDENT_VISIBILITY__IS_VISIBLE: Configuration.get('TEACHER_STUDENT_VISIBILITY__IS_VISIBLE') as boolean,
	FEATURE_SCHOOL_POLICY_ENABLED_NEW: Configuration.get('FEATURE_SCHOOL_POLICY_ENABLED_NEW') as boolean,
	FEATURE_SCHOOL_TERMS_OF_USE_ENABLED: Configuration.get('FEATURE_SCHOOL_TERMS_OF_USE_ENABLED') as boolean,
	FEATURE_ALLOW_INSECURE_LDAP_URL_ENABLED: Configuration.get('FEATURE_ALLOW_INSECURE_LDAP_URL_ENABLED') as boolean,
	GHOST_BASE_URL: Configuration.get('GHOST_BASE_URL') as string,
	ROCKETCHAT_SERVICE_ENABLED: Configuration.get('ROCKETCHAT_SERVICE_ENABLED') as boolean,
	JWT_SHOW_TIMEOUT_WARNING_SECONDS: Configuration.get('JWT_SHOW_TIMEOUT_WARNING_SECONDS') as number,
	JWT_TIMEOUT_SECONDS: Configuration.get('JWT_TIMEOUT_SECONDS') as number,
	NOT_AUTHENTICATED_REDIRECT_URL: Configuration.get('NOT_AUTHENTICATED_REDIRECT_URL') as string,
	DOCUMENT_BASE_DIR: Configuration.get('DOCUMENT_BASE_DIR') as string,
	SC_THEME: Configuration.get('SC_THEME') as SchulcloudTheme,
	SC_TITLE: Configuration.get('SC_TITLE') as string,
	SC_DOMAIN: Configuration.get('SC_DOMAIN') as string,
	SC_SHORTNAME: Configuration.get('SC_SHORTNAME') as string,
	TRAINING_URL: Configuration.get('TRAINING_URL') as string,
	INCOMING_REQUEST_TIMEOUT: Configuration.get('INCOMING_REQUEST_TIMEOUT_API') as number,
	INCOMING_REQUEST_TIMEOUT_COPY_API: Configuration.get('INCOMING_REQUEST_TIMEOUT_COPY_API') as number,
	NODE_ENV: Configuration.get('NODE_ENV') as NodeEnvType,
	STUDENT_TEAM_CREATION: Configuration.get('STUDENT_TEAM_CREATION') as string,
	FEATURE_TLDRAW_ENABLED: Configuration.get('FEATURE_TLDRAW_ENABLED') as boolean,
	FEATURE_ENABLE_LDAP_SYNC_DURING_MIGRATION: Configuration.get('FEATURE_ENABLE_LDAP_SYNC_DURING_MIGRATION') as boolean,
	I18N__DEFAULT_LANGUAGE: Configuration.get('I18N__DEFAULT_LANGUAGE') as unknown as LanguageType,
	I18N__FALLBACK_LANGUAGE: Configuration.get('I18N__FALLBACK_LANGUAGE') as unknown as LanguageType,
	I18N__DEFAULT_TIMEZONE: Configuration.get('I18N__DEFAULT_TIMEZONE') as Timezone,
	IMPORTUSER_SAVE_ALL_MATCHES_REQUEST_TIMEOUT_MS: Configuration.get(
		'IMPORTUSER_SAVE_ALL_MATCHES_REQUEST_TIMEOUT_MS'
	) as number,
	SCHULCONNEX_CLIENT__PERSONEN_INFO_TIMEOUT_IN_MS: Configuration.get(
		'SCHULCONNEX_CLIENT__PERSONEN_INFO_TIMEOUT_IN_MS'
	) as number,
	BOARD_COLLABORATION_URI: Configuration.get('BOARD_COLLABORATION_URI') as string,
	HOST: Configuration.get('HOST') as string,
	FEATURE_AI_TUTOR_ENABLED: Configuration.get('FEATURE_AI_TUTOR_ENABLED') as boolean,
	FEATURE_ROOM_ADD_EXTERNAL_PERSONS_ENABLED: Configuration.get('FEATURE_ROOM_ADD_EXTERNAL_PERSONS_ENABLED') as boolean,
	FEATURE_ROOM_REGISTER_EXTERNAL_PERSONS_ENABLED: Configuration.get(
		'FEATURE_ROOM_REGISTER_EXTERNAL_PERSONS_ENABLED'
	) as boolean,
	ROCKET_CHAT_URI: Configuration.get('ROCKET_CHAT_URI') as string,
	ROCKET_CHAT_ADMIN_ID: Configuration.get('ROCKET_CHAT_ADMIN_ID') as string,
	ROCKET_CHAT_ADMIN_TOKEN: Configuration.get('ROCKET_CHAT_ADMIN_TOKEN') as string,
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
