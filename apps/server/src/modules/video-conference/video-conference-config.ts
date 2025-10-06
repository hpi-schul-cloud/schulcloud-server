import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean } from '@shared/controller/transformer';
import { IsBoolean, IsString, IsUrl } from 'class-validator';

export const VIDEO_CONFERENCE_PUBLIC_API_CONFIG = 'VIDEO_CONFERENCE_PUBLIC_API_CONFIG';
@Configuration()
export class VideoConferencePublicApiConfig {
	@IsBoolean()
	@StringToBoolean()
	@ConfigProperty()
	public FEATURE_VIDEOCONFERENCE_ENABLED = true;
}

export const VIDEO_CONFERENCE_CONFIG_TOKEN = 'VIDEO_CONFERENCE_CONFIG_TOKEN';
@Configuration()
export class VideoConferenceConfig extends VideoConferencePublicApiConfig {
	@IsUrl({ require_tld: false })
	@ConfigProperty()
	public HOST!: string;

	@IsUrl()
	@ConfigProperty()
	public VIDEOCONFERENCE_HOST!: string;

	@IsString()
	@ConfigProperty()
	public VIDEOCONFERENCE_SALT = '';

	@IsString()
	@ConfigProperty()
	public VIDEOCONFERENCE_DEFAULT_PRESENTATION = '';
}
