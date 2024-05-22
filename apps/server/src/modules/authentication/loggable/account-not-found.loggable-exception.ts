import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';
import { Loggable } from '@src/core/logger/interfaces';
import { ErrorLogMessage } from '@src/core/logger/types';

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

	getLogMessage(): ErrorLogMessage {
		const message: ErrorLogMessage = {
			type: this.type,
			stack: this.stack,
			data: {},
		};

		return message;
	}
}
