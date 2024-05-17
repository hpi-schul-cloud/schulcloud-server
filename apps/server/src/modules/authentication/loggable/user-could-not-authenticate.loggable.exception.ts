import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';
import { Loggable } from '@src/core/logger/interfaces';
import { ErrorLogMessage } from '@src/core/logger/types';

export class UserCouldNotAuthenticateLoggableException extends BusinessError implements Loggable {
	constructor() {
		super(
			{
				type: 'UNAUTHORIZED_EXCEPTION',
				title: 'User could not authenticate',
				defaultMessage: 'LdapService connection failed because User could not authenticate',
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
