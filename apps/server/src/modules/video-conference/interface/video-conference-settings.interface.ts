import { IBbbSettings } from '../bbb';

export const VideoConferenceSettings = Symbol('VideoConferenceSettings');

export interface IVideoConferenceSettings {
	enabled: boolean;
	hostUrl: string;
	bbb: IBbbSettings;
}
