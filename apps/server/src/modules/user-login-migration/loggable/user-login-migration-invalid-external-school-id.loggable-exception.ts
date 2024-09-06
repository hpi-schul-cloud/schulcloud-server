import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class UserLoginMigrationInvalidExternalSchoolIdLoggableException extends BusinessError implements Loggable {
	constructor(private readonly externalSchoolId: string) {
		super(
			{
				type: 'USER_LOGIN_MIGRATION_INVALID_EXTERNAL_SCHOOL_ID',
				title: 'The given external school ID is invalid',
				defaultMessage: 'The given external school ID does not match with the migrated school',
			},
			HttpStatus.UNPROCESSABLE_ENTITY
		);
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: this.type,
			message: this.message,
			stack: this.stack,
			data: {
				externalSchoolId: this.externalSchoolId,
			},
		};
	}
}
