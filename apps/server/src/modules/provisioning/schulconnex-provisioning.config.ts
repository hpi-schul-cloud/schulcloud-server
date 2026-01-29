import type { CoreModuleConfig } from '@core/core.config';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import type { CourseSynchronizationHistoryConfig } from '@modules/course-synchronization-history';
import type { LegacySchoolConfig } from '@modules/legacy-school';
import type { MediaSourceConfig } from '@modules/media-source';

export interface SchulconnexProvisioningConfig
	extends LegacySchoolConfig,
		CoreModuleConfig,
		MediaSourceConfig,
		CourseSynchronizationHistoryConfig {
	LOGIN_BLOCK_TIME: number; // @TODO temporary until removed from other configs
}

const config: SchulconnexProvisioningConfig = {
	LOGIN_BLOCK_TIME: Configuration.get('LOGIN_BLOCK_TIME') as number,
	INCOMING_REQUEST_TIMEOUT: Configuration.get('INCOMING_REQUEST_TIMEOUT_API') as number,
};

export const schulconnexProvisioningConfig = () => config;
