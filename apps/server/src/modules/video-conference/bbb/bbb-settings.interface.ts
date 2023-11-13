export const BbbSettings = Symbol('BbbSettings');

export interface BbbSettingsInterface {
	host: string;
	salt: string;
	presentationUrl: string;
}
