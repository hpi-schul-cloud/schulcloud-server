import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@infra/logger';
import { UnprocessableEntityException } from '@nestjs/common';

export class UserLoginMigrationMultipleEmailUsersLoggableException
	extends UnprocessableEntityException
	implements Loggable
{
	constructor(private readonly email: string) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'USER_LOGIN_MIGRATION_MULTIPLE_EMAIL_USERS',
			message: 'There is multiple users with this email',
			stack: this.stack,
			data: {
				email: this.email,
			},
		};
	}
}
