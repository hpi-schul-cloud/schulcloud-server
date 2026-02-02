import type { CoreModuleConfig } from '@core/core.config';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import type { CourseSynchronizationHistoryConfig } from '@modules/course-synchronization-history';
import type { LegacySchoolConfig } from '@modules/legacy-school';
import type { MediaSourceConfig } from '@modules/media-source';

export interface SchulconnexProvisioningConfig
	extends LegacySchoolConfig,
		CoreModuleConfig,
		MediaSourceConfig,
		CourseSynchronizationHistoryConfig {}

const config: SchulconnexProvisioningConfig = {
	INCOMING_REQUEST_TIMEOUT: Configuration.get('INCOMING_REQUEST_TIMEOUT_API') as number,
};

export const schulconnexProvisioningConfig = () => config;
