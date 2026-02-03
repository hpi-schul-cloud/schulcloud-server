import type { CourseSynchronizationHistoryConfig } from '@modules/course-synchronization-history';
import type { LegacySchoolConfig } from '@modules/legacy-school';
import type { MediaSourceConfig } from '@modules/media-source';

export interface SchulconnexProvisioningConfig
	extends LegacySchoolConfig,
		MediaSourceConfig,
		CourseSynchronizationHistoryConfig {}

const config: SchulconnexProvisioningConfig = {};

export const schulconnexProvisioningConfig = () => config;
