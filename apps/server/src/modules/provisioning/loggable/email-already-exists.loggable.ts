import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class EmailAlreadyExistsLoggable extends BusinessError implements Loggable {
	constructor(private readonly email: string, private readonly externalId?: string) {
		super(
			{
				type: 'EMAIL_ALREADY_EXISTS',
				title: 'Email already Exists',
				defaultMessage: 'The Email to be provisioned already exists.',
			},
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: this.type,
			message: this.message,
			stack: this.stack,
			data: {
				email: this.email,
				externalId: this.externalId,
			},
		};
	}
}
