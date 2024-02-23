import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class IdTokenInvalidLoggableException extends BusinessError implements Loggable {
	constructor() {
		super(
			{
				type: 'ID_TOKEN_INVALID',
				title: 'Id token invalid',
				defaultMessage: 'Failed to validate idToken',
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
