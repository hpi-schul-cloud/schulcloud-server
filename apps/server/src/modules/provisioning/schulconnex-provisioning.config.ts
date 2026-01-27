import type { CoreModuleConfig } from '@core/core.config';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import type { RabbitMqConfig } from '@infra/rabbitmq';
import type { CourseSynchronizationHistoryConfig } from '@modules/course-synchronization-history';
import type { LegacySchoolConfig } from '@modules/legacy-school';
import type { MediaSourceConfig } from '@modules/media-source';
import type { UserLicenseConfig } from '@modules/user-license';

export interface SchulconnexProvisioningConfig
	extends RabbitMqConfig,
		LegacySchoolConfig,
		CoreModuleConfig,
		UserLicenseConfig,
		MediaSourceConfig,
		CourseSynchronizationHistoryConfig {
	LOGIN_BLOCK_TIME: number; // @TODO temporary until removed from other configs
}

const config: SchulconnexProvisioningConfig = {
	LOGIN_BLOCK_TIME: Configuration.get('LOGIN_BLOCK_TIME') as number,
	INCOMING_REQUEST_TIMEOUT: Configuration.get('INCOMING_REQUEST_TIMEOUT_API') as number,
	RABBITMQ_URI: Configuration.get('RABBITMQ_URI') as string,
};

export const schulconnexProvisioningConfig = () => config;
