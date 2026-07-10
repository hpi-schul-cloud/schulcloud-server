import { ForbiddenException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class UserMigrationIsNotEnabledLoggableException extends ForbiddenException implements Loggable {
	constructor(
		private readonly userId?: string,
		private readonly schoolId?: string
	) {
		super({
			message: 'Feature flag of user migration may be disable or the school is not an LDAP pilot',
		});
	}

	public getLogMessage(): LoggableMessage {
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
