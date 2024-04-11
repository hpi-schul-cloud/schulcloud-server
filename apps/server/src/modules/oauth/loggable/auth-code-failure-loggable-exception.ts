import { InternalServerErrorException } from '@nestjs/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class AuthCodeFailureLoggableException extends InternalServerErrorException implements Loggable {
	constructor(private readonly errorCode?: string) {
		super(errorCode ?? 'sso_auth_code_step', 'Authorization Query Object has no authorization code or error');
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'SSO_AUTH_CODE_STEP',
			message: 'Authorization Query Object has no authorization code or error',
			stack: this.stack,
			data: {
				errorCode: this.errorCode,
			},
		};
	}
}
