import { Loggable } from '@core/logger/interfaces';
import { ErrorLogMessage } from '@core/logger/types';
import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';

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
