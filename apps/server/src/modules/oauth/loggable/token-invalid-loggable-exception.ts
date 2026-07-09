import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

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

	public getLogMessage(): LoggableMessage {
		return {
			type: this.type,
			message: this.message,
			stack: this.stack,
		};
	}
}
