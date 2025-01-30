import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';

export class UserLoginMigrationUserAlreadyMigratedLoggableException extends BusinessError implements Loggable {
	constructor(private readonly externalUserId: string) {
		super(
			{
				type: 'USER_LOGIN_MIGRATION_USER_HAS_ALREADY_MIGRATED',
				title: 'User has already migrated',
				defaultMessage: 'User with externalId has already migrated',
			},
			HttpStatus.UNPROCESSABLE_ENTITY,
			{
				multipleUsersFound: true,
			}
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
