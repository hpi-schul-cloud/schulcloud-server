import type { CoreModuleConfig } from '@core/core.config';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { DeletionConfig } from '@modules/deletion';
import { LegacySchoolConfig } from '@modules/legacy-school';
import { RegistrationPinConfig } from '@modules/registration-pin';
import { ToolConfig } from '@modules/tool';
import { UserConfig } from '@modules/user';
import { LanguageType } from '@shared/domain/interface';

export interface AdminApiServerConfig
	extends CoreModuleConfig,
		DeletionConfig,
		LegacySchoolConfig,
		UserConfig,
		RegistrationPinConfig,
		ToolConfig {
	ROCKET_CHAT_URI: string;
	ROCKET_CHAT_ADMIN_ID: string;
	ROCKET_CHAT_ADMIN_TOKEN: string;
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
	ROCKET_CHAT_URI: Configuration.get('ROCKET_CHAT_URI') as string,
	ROCKET_CHAT_ADMIN_ID: Configuration.get('ROCKET_CHAT_ADMIN_ID') as string,
	ROCKET_CHAT_ADMIN_TOKEN: Configuration.get('ROCKET_CHAT_ADMIN_TOKEN') as string,
	TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE: Configuration.get(
		'TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE'
	) as boolean,
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
