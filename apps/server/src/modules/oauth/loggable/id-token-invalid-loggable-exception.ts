import { ErrorLogMessage, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { OauthSsoErrorLoggableException } from './oauth-sso-error-loggable-exception';

export class IdTokenInvalidLoggableException extends OauthSsoErrorLoggableException {
	override getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'SSO_JWT_PROBLEM',
			message: 'Failed to validate idToken',
			stack: this.stack,
		};
	}
}
