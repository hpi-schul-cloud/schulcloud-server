import type { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';

export class MultipleUsersFoundLoggableException extends BusinessError implements Loggable {
	constructor(private readonly externalUserId: string) {
		super(
			{
				type: 'MULTIPLE_USERS_FOUND',
				title: 'Multiple users found',
				defaultMessage: 'Multiple users found with this externalId',
			},
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
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
