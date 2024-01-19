import { ErrorLogMessage, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { OauthSsoErrorLoggableException } from './oauth-sso-error-loggable-exception';

export class OauthConfigMissingLoggableException extends OauthSsoErrorLoggableException {
	constructor(private readonly systemId: string) {
		super();
	}

	override getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'SSO_INTERNAL_ERROR',
			message: 'Requested system has no oauth configured',
			stack: this.stack,
			data: {
				systemId: this.systemId,
			},
		};
	}
}
