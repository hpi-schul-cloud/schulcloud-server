import { IBbbSettings } from '../bbb/bbb-settings.interface';

export const VideoConferenceSettings = Symbol('VideoConferenceSettings');

export interface IVideoConferenceSettings {
	enabled: boolean;
	hostUrl: string;
	bbb: IBbbSettings;
}
