import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean } from '@shared/controller/transformer';
import { IsBoolean } from 'class-validator';

export const GROUP_CONFIG_TOKEN = 'GROUP_CONFIG_TOKEN';

@Configuration()
export class GroupConfig {
	@ConfigProperty('FEATURE_SCHULCONNEX_COURSE_SYNC_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public featureSchulconnexCourseSyncEnabled = false;
}
