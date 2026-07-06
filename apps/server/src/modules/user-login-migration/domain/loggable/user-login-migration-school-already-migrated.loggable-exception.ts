import { UnprocessableEntityException } from '@nestjs/common';
import { Loggable, LoggableMessage } from '@shared/common/loggable';

export class UserLoginMigrationSchoolAlreadyMigratedLoggableException
	extends UnprocessableEntityException
	implements Loggable
{
	constructor(private readonly schoolId: string) {
		super();
	}

	getLogMessage(): LoggableMessage {
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
