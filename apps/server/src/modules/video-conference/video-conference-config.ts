import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { IBbbSettings } from './bbb';
import { IVideoConferenceSettings } from './interface';

export default class VideoConferenceConfiguration {
	static bbb: IBbbSettings = {
		host: Configuration.get('VIDEOCONFERENCE_HOST') as string,
		salt: Configuration.get('VIDEOCONFERENCE_SALT') as string,
		presentationUrl: Configuration.get('VIDEOCONFERENCE_DEFAULT_PRESENTATION') as string,
	};

	static videoConference: IVideoConferenceSettings = {
		enabled: Configuration.get('FEATURE_VIDEOCONFERENCE_ENABLED') as boolean,
		hostUrl: Configuration.get('HOST') as string,
		bbb: VideoConferenceConfiguration.bbb,
	};
}
