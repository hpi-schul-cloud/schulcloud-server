import { UnprocessableEntityException } from '@nestjs/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class UserLoginMigrationInvalidAdminLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(private readonly userId: string) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'USER_LOGIN_MIGRATION_INVALID_ADMIN',
			message: 'The user is not an administrator',
			stack: this.stack,
			data: {
				userId: this.userId,
			},
		};
	}
}
