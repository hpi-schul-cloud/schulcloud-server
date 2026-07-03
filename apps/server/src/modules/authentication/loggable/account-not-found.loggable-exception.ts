import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';
import { Loggable, LoggableMessage } from '@shared/common/loggable';

export class AccountNotFoundLoggableException extends BusinessError implements Loggable {
	constructor() {
		super(
			{
				type: 'UNAUTHORIZED_EXCEPTION',
				title: 'Login has failed because account not found',
				defaultMessage: 'Login has failed because account not found',
			},
			HttpStatus.UNAUTHORIZED
		);
	}

	getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
			type: this.type,
			stack: this.stack,
			data: {},
		};

		return message;
	}
}
