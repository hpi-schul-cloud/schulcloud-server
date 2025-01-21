import { Loggable } from '@core/logger/interfaces';
import { ErrorLogMessage } from '@core/logger/types';
import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';

export class LdapUserCouldNotBeAuthenticatedLoggableException extends BusinessError implements Loggable {
	constructor(private readonly error: Error) {
		super(
			{
				type: 'UNAUTHORIZED_EXCEPTION',
				title: 'User could not be authenticated',
				defaultMessage: 'LdapService connection failed because User could not be authenticated',
			},
			HttpStatus.UNAUTHORIZED
		);
	}

	getLogMessage(): ErrorLogMessage {
		const message: ErrorLogMessage = {
			type: this.type,
			stack: this.stack,
			data: {
				error: JSON.stringify(this.error),
			},
		};

		return message;
	}
}
