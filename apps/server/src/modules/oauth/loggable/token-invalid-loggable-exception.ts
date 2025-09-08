import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';

export class TokenInvalidLoggableException extends BusinessError implements Loggable {
	constructor() {
		super(
			{
				type: 'TOKEN_INVALID',
				title: 'token invalid',
				defaultMessage: 'Failed to validate token',
			},
			HttpStatus.UNAUTHORIZED
		);
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: this.type,
			message: this.message,
			stack: this.stack,
		};
	}
}
