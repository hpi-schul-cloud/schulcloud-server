import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class MultipleUsersFoundLoggableException extends BusinessError implements Loggable {
	constructor(private readonly externalUserId: string) {
		super(
			{
				type: 'MULTIPLE_USERS_FOUND_LOGGABLE_EXCEPTION',
				title: 'Multiple users found',
				defaultMessage: 'Multiple users found with this externalId',
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
				externalUserId: this.externalUserId,
			},
		};
	}
}
