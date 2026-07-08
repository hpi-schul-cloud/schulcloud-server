import { UnprocessableEntityException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class UserLoginMigrationMultipleEmailUsersLoggableException
	extends UnprocessableEntityException
	implements Loggable
{
	constructor(private readonly email: string) {
		super();
	}

	getLogMessage(): LoggableMessage {
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
