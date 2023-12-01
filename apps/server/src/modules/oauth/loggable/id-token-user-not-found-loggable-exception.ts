import { ErrorLogMessage, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { OauthSsoErrorLoggableException } from './oauth-sso-error-loggable-exception';

export class IdTokenUserNotFoundLoggableException extends OauthSsoErrorLoggableException {
	constructor(private readonly uuid: string, private readonly additionalInfo?: string) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'SSO_USER_NOTFOUND',
			message: 'Failed to find user with uuid from id token',
			stack: this.stack,
			data: {
				uuid: this.uuid,
				additionalInfo: this.additionalInfo,
			},
		};
	}
}
