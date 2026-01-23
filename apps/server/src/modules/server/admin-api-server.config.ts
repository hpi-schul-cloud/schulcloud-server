import type { CoreModuleConfig } from '@core/core.config';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { DeletionConfig } from '@modules/deletion';
import { LegacySchoolConfig } from '@modules/legacy-school';
import { RegistrationPinConfig } from '@modules/registration-pin';
import { UserConfig } from '@modules/user';
import { LanguageType } from '@shared/domain/interface';

export interface AdminApiServerConfig
	extends CoreModuleConfig,
		DeletionConfig,
		LegacySchoolConfig,
		UserConfig,
		RegistrationPinConfig {
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
	AVAILABLE_LANGUAGES: (Configuration.get('I18N__AVAILABLE_LANGUAGES') as string).split(',') as LanguageType[],
	ROCKET_CHAT_URI: Configuration.get('ROCKET_CHAT_URI') as string,
	ROCKET_CHAT_ADMIN_ID: Configuration.get('ROCKET_CHAT_ADMIN_ID') as string,
	ROCKET_CHAT_ADMIN_TOKEN: Configuration.get('ROCKET_CHAT_ADMIN_TOKEN') as string,
	TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE: Configuration.get(
		'TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE'
	) as boolean,
	TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION: Configuration.get(
		'TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION'
	) as string,
	INCOMING_REQUEST_TIMEOUT: Configuration.get('INCOMING_REQUEST_TIMEOUT_API') as number,
	CALENDAR_SERVICE_ENABLED: Configuration.get('CALENDAR_SERVICE_ENABLED') as boolean,
};

export const adminApiServerConfig = () => config;
