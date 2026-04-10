import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean } from '@shared/controller/transformer';
import { IsBoolean, IsString, IsUrl } from 'class-validator';

export const VIDEO_CONFERENCE_PUBLIC_API_CONFIG = 'VIDEO_CONFERENCE_PUBLIC_API_CONFIG';
@Configuration()
export class VideoConferencePublicApiConfig {
	@IsBoolean()
	@StringToBoolean()
	@ConfigProperty('FEATURE_VIDEOCONFERENCE_ENABLED')
	public featureVideoConferenceEnabled = false;
}

export const VIDEO_CONFERENCE_CONFIG_TOKEN = 'VIDEO_CONFERENCE_CONFIG_TOKEN';
@Configuration()
export class VideoConferenceConfig extends VideoConferencePublicApiConfig {
	@IsUrl({ require_tld: false })
	@ConfigProperty('HOST')
	public scHostUrl!: string;

	@IsUrl({ require_tld: false })
	@ConfigProperty('VIDEOCONFERENCE_HOST')
	public videoConferenceHost = 'https://bigbluebutton.schul-cloud.org/bigbluebutton';

	@IsString()
	@ConfigProperty('VIDEOCONFERENCE_SALT')
	public videoConferenceSalt = '';

	@IsString()
	@ConfigProperty('VIDEOCONFERENCE_DEFAULT_PRESENTATION')
	public videoConferenceDefaultPresentation = '';
}
