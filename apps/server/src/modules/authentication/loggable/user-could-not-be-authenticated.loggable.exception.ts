import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

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

	public getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
			type: this.type,
			stack: this.stack,
			data: {
				error: JSON.stringify(this.error),
			},
		};

		return message;
	}
}
