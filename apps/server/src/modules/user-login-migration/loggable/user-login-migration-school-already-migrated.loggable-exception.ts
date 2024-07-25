import { UnprocessableEntityException } from '@nestjs/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class UserLoginMigrationSchoolAlreadyMigratedLoggableException
	extends UnprocessableEntityException
	implements Loggable
{
	constructor(private readonly schoolId: string) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'USER_LOGIN_MIGRATION_SCHOOL_HAS_ALREADY_MIGRATED',
			message: 'School has already migrated',
			stack: this.stack,
			data: {
				schoolId: this.schoolId,
			},
		};
	}
}
