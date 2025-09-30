import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean } from '@shared/controller/transformer';
import { IsBoolean, IsUrl } from 'class-validator';

export const VIDEO_CONFERENCE_CONFIG_TOKEN = 'VIDEO_CONFERENCE_CONFIG_TOKEN';
@Configuration()
export class VideoConferenceConfig {
	@IsUrl({ require_tld: false })
	@ConfigProperty()
	public HOST!: string;

	@IsBoolean()
	@StringToBoolean()
	@ConfigProperty()
	public FEATURE_VIDEOCONFERENCE_ENABLED = false;
}
