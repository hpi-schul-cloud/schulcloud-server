import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class MultipleUsersFoundInMigrationLoggableException extends BusinessError implements Loggable {
	constructor(private readonly externalUserId: string) {
		super(
			{
				type: 'USER_LOGIN_MIGRATION_USER_HAS_ALREADY_MIGRATED',
				title: 'User has already migrated',
				defaultMessage: 'User with externalId has already migrated',
			},
			HttpStatus.INTERNAL_SERVER_ERROR,
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
