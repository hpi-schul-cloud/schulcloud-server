import { UnprocessableEntityException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class UserLoginMigrationInvalidAdminLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(private readonly userId: string) {
		super();
	}

	public getLogMessage(): LoggableMessage {
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
