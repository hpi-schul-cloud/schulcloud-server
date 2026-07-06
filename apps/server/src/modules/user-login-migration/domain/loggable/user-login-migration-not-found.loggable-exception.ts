import { NotFoundException } from '@nestjs/common';
import { Loggable, LoggableMessage } from '@shared/common/loggable';
import { EntityId } from '@shared/domain/types';

export class UserLoginMigrationNotFoundLoggableException extends NotFoundException implements Loggable {
	constructor(
		private readonly schoolId: EntityId,
		private readonly userLoginMigrationId?: EntityId
	) {
		super();
	}

	getLogMessage(): LoggableMessage {
		return {
			type: 'USER_LOGIN_MIGRATION_NOT_FOUND',
			message: 'Cannot find requested user login migration for school.',
			stack: this.stack,
			data: {
				schoolId: this.schoolId,
				userLoginMigrationId: this.userLoginMigrationId,
			},
		};
	}
}
