import { BbbSettingsInterface } from '../bbb';

export const VideoConferenceSettings = Symbol('VideoConferenceSettings');

export interface VideoConferenceSettingsInterface {
	enabled: boolean;
	hostUrl: string;
	bbb: BbbSettingsInterface;
}
