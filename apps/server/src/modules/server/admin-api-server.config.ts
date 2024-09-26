import { DeletionConfig } from '@modules/deletion';
import { AuthGuardConfig } from '@infra/auth-guard';
import { LegacySchoolConfig } from '@modules/legacy-school';
import { UserConfig } from '@modules/user';
import { RegistrationPinConfig } from '@modules/registration-pin';
import { ToolConfig } from '@modules/tool';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { LanguageType } from '@shared/domain/interface';

export interface AdminApiServerConfig
	extends DeletionConfig,
		LegacySchoolConfig,
		UserConfig,
		RegistrationPinConfig,
		ToolConfig,
		AuthGuardConfig {
	ETHERPAD__API_KEY?: string;
	ETHERPAD__URI?: string;
}

const config: AdminApiServerConfig = {
	ADMIN_API__MODIFICATION_THRESHOLD_MS: Configuration.get('ADMIN_API__MODIFICATION_THRESHOLD_MS') as number,
	ADMIN_API__MAX_CONCURRENT_DELETION_REQUESTS: Configuration.get(
		'ADMIN_API__MAX_CONCURRENT_DELETION_REQUESTS'
	) as number,
	ADMIN_API__DELETION_DELAY_MILLISECONDS: Configuration.get('ADMIN_API__DELETION_DELAY_MILLISECONDS') as number,
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
	FEATURE_CTL_TOOLS_TAB_ENABLED: Configuration.get('FEATURE_CTL_TOOLS_TAB_ENABLED') as boolean,
	FEATURE_LTI_TOOLS_TAB_ENABLED: Configuration.get('FEATURE_LTI_TOOLS_TAB_ENABLED') as boolean,
	CTL_TOOLS__EXTERNAL_TOOL_MAX_LOGO_SIZE_IN_BYTES: Configuration.get(
		'CTL_TOOLS__EXTERNAL_TOOL_MAX_LOGO_SIZE_IN_BYTES'
	) as number,
	CTL_TOOLS_BACKEND_URL: Configuration.get('PUBLIC_BACKEND_URL') as string,
	FEATURE_CTL_TOOLS_COPY_ENABLED: Configuration.get('FEATURE_CTL_TOOLS_COPY_ENABLED') as boolean,
	CTL_TOOLS_RELOAD_TIME_MS: Configuration.get('CTL_TOOLS_RELOAD_TIME_MS') as number,
	FILES_STORAGE__SERVICE_BASE_URL: Configuration.get('FILES_STORAGE__SERVICE_BASE_URL') as string,
	ROCKET_CHAT_URI: Configuration.get('ROCKET_CHAT_URI') as string,
	ROCKET_CHAT_ADMIN_ID: Configuration.get('ROCKET_CHAT_ADMIN_ID') as string,
	ROCKET_CHAT_ADMIN_TOKEN: Configuration.get('ROCKET_CHAT_ADMIN_TOKEN') as string,
	ROCKET_CHAT_ADMIN_USER: Configuration.get('ROCKET_CHAT_ADMIN_USER') as string,
	ROCKET_CHAT_ADMIN_PASSWORD: Configuration.get('ROCKET_CHAT_ADMIN_PASSWORD') as string,
	ADMIN_API__ALLOWED_API_KEYS: (Configuration.get('ADMIN_API__ALLOWED_API_KEYS') as string)
		.split(',')
		.map((part) => (part.split(':').pop() ?? '').trim()),
	JWT_AUD: Configuration.get('JWT_AUD') as string,
	JWT_LIFETIME: Configuration.get('JWT_LIFETIME') as string,
	AUTHENTICATION: Configuration.get('AUTHENTICATION') as string,
	LOGIN_BLOCK_TIME: 0,
	TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE: Configuration.get(
		'TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE'
	) as boolean,
	FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED: Configuration.get('FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED') as boolean,
	FEATURE_IDENTITY_MANAGEMENT_STORE_ENABLED: Configuration.get('FEATURE_IDENTITY_MANAGEMENT_STORE_ENABLED') as boolean,
};

export const adminApiServerConfig = () => config;
