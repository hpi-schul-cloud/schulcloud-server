import { NotFoundException } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class UserLoginMigrationNotFoundLoggableException extends NotFoundException implements Loggable {
	constructor(
		private readonly userId: EntityId,
		private readonly schoolId: EntityId,
		private readonly userLoginMigrationId?: EntityId
	) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'USER_LOGIN_MIGRATION_NOT_FOUND',
			message: 'Cannot find requested user login migration for school.',
			data: {
				userId: this.userId,
				schoolId: this.schoolId,
				userLoginMigrationId: this.userLoginMigrationId,
			},
		};
	}
}
