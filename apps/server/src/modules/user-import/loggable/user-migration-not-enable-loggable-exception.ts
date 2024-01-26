import { ForbiddenException } from '@nestjs/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class UserMigrationIsNotEnabledLoggableException extends ForbiddenException implements Loggable {
	constructor(private readonly userId?: string, private readonly schoolId?: string) {
		super({
			message: 'Feature flag of user migration may be disable or the school is not an LDAP pilot',
		});
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'USER_MIGRATION_IS_NOT_ENABLED',
			message: 'Feature flag of user migration may be disable or the school is not an LDAP pilot',
			stack: this.stack,
			data: {
				userId: this.userId,
				schoolId: this.schoolId,
			},
		};
	}
}
