import type { CoreModuleConfig } from '@core/core.config';
import type { LoggerConfig } from '@core/logger';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import type { RabbitMqConfig } from '@infra/rabbitmq';
import type { CourseSynchronizationHistoryConfig } from '@modules/course-synchronization-history';
import type { GroupConfig } from '@modules/group';
import type { LearnroomConfig } from '@modules/learnroom';
import type { LegacySchoolConfig } from '@modules/legacy-school';
import type { MediaSourceConfig } from '@modules/media-source';
import type { RoleConfig } from '@modules/role';
import type { SystemConfig } from '@modules/system';
import type { ToolConfig } from '@modules/tool';
import type { UserConfig } from '@modules/user';
import type { UserLicenseConfig } from '@modules/user-license';
import type { LanguageType } from '@shared/domain/interface';
import type { ProvisioningConfig } from './provisioning.config';

export interface SchulconnexProvisioningConfig
	extends ProvisioningConfig,
		RabbitMqConfig,
		UserConfig,
		LoggerConfig,
		LegacySchoolConfig,
		RoleConfig,
		SystemConfig,
		GroupConfig,
		LearnroomConfig,
		CoreModuleConfig,
		UserLicenseConfig,
		MediaSourceConfig,
		ToolConfig,
		CourseSynchronizationHistoryConfig {}

const config: SchulconnexProvisioningConfig = {
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
	EXIT_ON_ERROR: Configuration.get('EXIT_ON_ERROR') as boolean,
	AVAILABLE_LANGUAGES: (Configuration.get('I18N__AVAILABLE_LANGUAGES') as string).split(',') as LanguageType[],
	FEATURE_COLUMN_BOARD_ENABLED: Configuration.get('FEATURE_COLUMN_BOARD_ENABLED') as boolean,
	FEATURE_COPY_SERVICE_ENABLED: Configuration.get('FEATURE_COPY_SERVICE_ENABLED') as boolean,
	FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_ENABLED: Configuration.get(
		'FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_ENABLED'
	) as boolean,
	FEATURE_COMMON_CARTRIDGE_COURSE_EXPORT_ENABLED: Configuration.get(
		'FEATURE_COMMON_CARTRIDGE_COURSE_EXPORT_ENABLED'
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
	LOGIN_BLOCK_TIME: Configuration.get('LOGIN_BLOCK_TIME') as number,
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
	FEATURE_OTHER_GROUPUSERS_PROVISIONING_ENABLED: Configuration.get(
		'FEATURE_OTHER_GROUPUSERS_PROVISIONING_ENABLED'
	) as boolean,
	FEATURE_SCHULCONNEX_GROUP_PROVISIONING_ENABLED: Configuration.get(
		'FEATURE_SCHULCONNEX_GROUP_PROVISIONING_ENABLED'
	) as boolean,
	FEATURE_SCHULCONNEX_COURSE_SYNC_ENABLED: Configuration.get('FEATURE_SCHULCONNEX_COURSE_SYNC_ENABLED') as boolean,
	INCOMING_REQUEST_TIMEOUT: Configuration.get('INCOMING_REQUEST_TIMEOUT_API') as number,
	PROVISIONING_SCHULCONNEX_POLICIES_INFO_URL: Configuration.get('PROVISIONING_SCHULCONNEX_POLICIES_INFO_URL') as string,
	RABBITMQ_URI: Configuration.get('RABBITMQ_URI') as string,
	GEOGEBRA_BASE_URL: Configuration.get('GEOGEBRA_BASE_URL') as string,
	SCHULCONNEX_COURSE_SYNC_HISTORY_EXPIRATION_SECONDS: Configuration.get(
		'SCHULCONNEX_COURSE_SYNC_HISTORY_EXPIRATION_SECONDS'
	) as number,
};

export const schulconnexProvisioningConfig = () => config;
