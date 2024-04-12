import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class MultipleUsersFoundLoggableException extends BusinessError implements Loggable {
	constructor() {
		super(
			{
				type: 'MULTIPLE_USERS_MIGRATION_LOGGABLE_EXCEPTION',
				title: 'User has already migrated',
				defaultMessage: 'User has already migrated',
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
		};
	}
}
