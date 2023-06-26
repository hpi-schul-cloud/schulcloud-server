export const BbbSettings = Symbol('BbbSettings');

export interface IBbbSettings {
	host: string;
	salt: string;
	presentationUrl: string;
}
