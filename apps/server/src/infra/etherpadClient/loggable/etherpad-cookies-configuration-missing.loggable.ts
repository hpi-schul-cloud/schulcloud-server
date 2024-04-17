import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export enum MissingCookie {
	cookieReleaseThreshold,
	cookieExpiration,
}

export class EtherpadCookiesConfigurationMissingLoggable implements Loggable {
	private cookieValue: number;

	private missingCookie: MissingCookie;

	constructor(cookieValue: number, missingCookie: MissingCookie) {
		this.cookieValue = cookieValue;
		this.missingCookie = missingCookie;
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		switch (this.missingCookie) {
			case MissingCookie.cookieExpiration:
				return {
					message: `EtherpadRestClient: Missing cookies expiration configuration. Setting cookie expiration to default value ${this.cookieValue}`,
				};
			case MissingCookie.cookieReleaseThreshold:
				return {
					message: `EtherpadRestClient: Missing cookies release threshold configuration. Setting cookie release threshold to default value ${this.cookieValue}`,
				};

			default:
				return {
					message: `EtherpadRestClient: Missing cookie default value was not set properly}`,
				};
		}
	}
}
