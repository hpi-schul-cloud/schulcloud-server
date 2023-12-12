import { ErrorLogMessage, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { OauthSsoErrorLoggableException } from './oauth-sso-error-loggable-exception';

export class IdTokenExtractionFailureLoggableException extends OauthSsoErrorLoggableException {
	constructor(private readonly fieldName: string) {
		super();
	}

	override getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'SSO_JWT_PROBLEM',
			message: 'Failed to extract field',
			stack: this.stack,
			data: {
				fieldName: this.fieldName,
			},
		};
	}
}
