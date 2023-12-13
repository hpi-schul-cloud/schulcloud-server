import { InternalServerErrorException } from '@nestjs/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class OauthSsoErrorLoggableException extends InternalServerErrorException implements Loggable {
	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'SSO_LOGIN_FAILED',
			message: this.message,
			stack: this.stack,
		};
	}
}
