import type { CoreModuleConfig } from '@core/core.config';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import type { RabbitMqConfig } from '@infra/rabbitmq';
import type { CourseSynchronizationHistoryConfig } from '@modules/course-synchronization-history';
import type { LegacySchoolConfig } from '@modules/legacy-school';
import type { MediaSourceConfig } from '@modules/media-source';
import type { UserConfig } from '@modules/user';
import type { UserLicenseConfig } from '@modules/user-license';
import type { LanguageType } from '@shared/domain/interface';

export interface SchulconnexProvisioningConfig
	extends RabbitMqConfig,
		UserConfig,
		LegacySchoolConfig,
		CoreModuleConfig,
		UserLicenseConfig,
		MediaSourceConfig,
		CourseSynchronizationHistoryConfig {
	LOGIN_BLOCK_TIME: number; // @TODO temporary until removed from other configs
}

const config: SchulconnexProvisioningConfig = {
	AVAILABLE_LANGUAGES: (Configuration.get('I18N__AVAILABLE_LANGUAGES') as string).split(',') as LanguageType[],
	LOGIN_BLOCK_TIME: Configuration.get('LOGIN_BLOCK_TIME') as number,
	TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE: Configuration.get(
		'TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE'
	) as boolean,
	TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION: Configuration.get(
		'TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION'
	) as string,
	INCOMING_REQUEST_TIMEOUT: Configuration.get('INCOMING_REQUEST_TIMEOUT_API') as number,
	RABBITMQ_URI: Configuration.get('RABBITMQ_URI') as string,
	CALENDAR_SERVICE_ENABLED: Configuration.get('CALENDAR_SERVICE_ENABLED') as boolean,
};

export const schulconnexProvisioningConfig = () => config;
