import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { XApiKeyAuthGuardConfig } from '@infra/auth-guard';
import { DeletionConfig } from '@modules/deletion';
import { LegacySchoolConfig } from '@modules/legacy-school';
import { RegistrationPinConfig } from '@modules/registration-pin';
import { ToolConfig } from '@modules/tool';
import { UserConfig } from '@modules/user';
import { LanguageType } from '@shared/domain/interface';
import type { CoreModuleConfig } from '@core/core.config';
import type { Algorithm } from 'jsonwebtoken';
import { AuthenticationConfig } from '@modules/authentication';
import { ValkeyMode } from '@infra/valkey-client';

export interface AdminApiServerConfig
	extends CoreModuleConfig,
		AuthenticationConfig,
		DeletionConfig,
		LegacySchoolConfig,
		UserConfig,
		RegistrationPinConfig,
		ToolConfig,
		XApiKeyAuthGuardConfig {
	ETHERPAD__API_KEY?: string;
	ETHERPAD__URI?: string;
	JWT_SHOW_TIMEOUT_WARNING_SECONDS: number;
	JWT_TIMEOUT_SECONDS: number;
}

const config: AdminApiServerConfig = {
	ADMIN_API__DELETION_DELETE_AFTER_MINUTES: Configuration.get('ADMIN_API__DELETION_DELETE_AFTER_MINUTES') as number,
	ADMIN_API__DELETION_MODIFICATION_THRESHOLD_MS: Configuration.get(
		'ADMIN_API__DELETION_MODIFICATION_THRESHOLD_MS'
	) as number,
	ADMIN_API__DELETION_EXECUTION_BATCH_NUMBER: Configuration.get('ADMIN_API__DELETION_EXECUTION_BATCH_NUMBER') as number,
	ADMIN_API__DELETION_CONSIDER_FAILED_AFTER_MS: Configuration.get(
		'ADMIN_API__DELETION_CONSIDER_FAILED_AFTER_MS'
	) as number,
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
	EXIT_ON_ERROR: Configuration.get('EXIT_ON_ERROR') as boolean,
	AVAILABLE_LANGUAGES: (Configuration.get('I18N__AVAILABLE_LANGUAGES') as string).split(',') as LanguageType[],
	FEATURE_COMMON_CARTRIDGE_COURSE_EXPORT_ENABLED: Configuration.get(
		'FEATURE_COMMON_CARTRIDGE_COURSE_EXPORT_ENABLED'
	) as boolean,
	GEOGEBRA_BASE_URL: Configuration.get('GEOGEBRA_BASE_URL') as string,
	FEATURE_COLUMN_BOARD_ENABLED: Configuration.get('FEATURE_COLUMN_BOARD_ENABLED') as boolean,
	FEATURE_COPY_SERVICE_ENABLED: Configuration.get('FEATURE_COPY_SERVICE_ENABLED') as boolean,
	FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_ENABLED: Configuration.get(
		'FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_ENABLED'
	) as boolean,
	FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_MAX_FILE_SIZE: Configuration.get(
		'FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_MAX_FILE_SIZE'
	) as number,
	CTL_TOOLS__EXTERNAL_TOOL_MAX_LOGO_SIZE_IN_BYTES: Configuration.get(
		'CTL_TOOLS__EXTERNAL_TOOL_MAX_LOGO_SIZE_IN_BYTES'
	) as number,
	CTL_TOOLS_BACKEND_URL: Configuration.get('PUBLIC_BACKEND_URL') as string,
	FEATURE_CTL_TOOLS_COPY_ENABLED: Configuration.get('FEATURE_CTL_TOOLS_COPY_ENABLED') as boolean,
	CTL_TOOLS_RELOAD_TIME_MS: Configuration.get('CTL_TOOLS_RELOAD_TIME_MS') as number,
	FILES_STORAGE__SERVICE_BASE_URL: Configuration.get('FILES_STORAGE__SERVICE_BASE_URL') as string,
	SC_DOMAIN: Configuration.get('SC_DOMAIN') as string,
	FEATURE_EXTERNAL_SYSTEM_LOGOUT_ENABLED: Configuration.get('FEATURE_EXTERNAL_SYSTEM_LOGOUT_ENABLED') as boolean,
	SESSION_VALKEY__MODE: Configuration.get('SESSION_VALKEY__MODE') as ValkeyMode,
	FEATURE_JWT_EXTENDED_TIMEOUT_ENABLED: Configuration.get('FEATURE_JWT_EXTENDED_TIMEOUT_ENABLED') as boolean,
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
	ROCKET_CHAT_URI: Configuration.get('ROCKET_CHAT_URI') as string,
	ROCKET_CHAT_ADMIN_ID: Configuration.get('ROCKET_CHAT_ADMIN_ID') as string,
	ROCKET_CHAT_ADMIN_TOKEN: Configuration.get('ROCKET_CHAT_ADMIN_TOKEN') as string,
	ROCKET_CHAT_ADMIN_USER: Configuration.get('ROCKET_CHAT_ADMIN_USER') as string,
	ROCKET_CHAT_ADMIN_PASSWORD: Configuration.get('ROCKET_CHAT_ADMIN_PASSWORD') as string,
	ADMIN_API__ALLOWED_API_KEYS: (Configuration.get('ADMIN_API__ALLOWED_API_KEYS') as string)
		.split(',')
		.map((part) => (part.split(':').pop() ?? '').trim()),
	LOGIN_BLOCK_TIME: 0,
	TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE: Configuration.get(
		'TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE'
	) as boolean,
	FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED: Configuration.get('FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED') as boolean,
	FEATURE_IDENTITY_MANAGEMENT_STORE_ENABLED: Configuration.get('FEATURE_IDENTITY_MANAGEMENT_STORE_ENABLED') as boolean,
	CTL_TOOLS__PREFERRED_TOOLS_LIMIT: Configuration.get('CTL_TOOLS__PREFERRED_TOOLS_LIMIT') as number,
	FEATURE_PREFERRED_CTL_TOOLS_ENABLED: Configuration.get('FEATURE_PREFERRED_CTL_TOOLS_ENABLED') as boolean,
	TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION: Configuration.get(
		'TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION'
	) as string,
	PUBLIC_BACKEND_URL: Configuration.get('PUBLIC_BACKEND_URL') as string,
	FEATURE_VIDIS_MEDIA_ACTIVATIONS_ENABLED: Configuration.get('FEATURE_VIDIS_MEDIA_ACTIVATIONS_ENABLED') as boolean,
	FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED: Configuration.get('FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED') as boolean,
	INCOMING_REQUEST_TIMEOUT: Configuration.get('INCOMING_REQUEST_TIMEOUT_API') as number,
	CALENDAR_SERVICE_ENABLED: Configuration.get('CALENDAR_SERVICE_ENABLED') as boolean,
};

export const adminApiServerConfig = () => config;
