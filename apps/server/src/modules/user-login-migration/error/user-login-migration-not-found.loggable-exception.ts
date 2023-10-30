import { NotFoundException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types/entity-id';
import { Loggable } from '@src/core/logger/interfaces/loggable';
import { ErrorLogMessage, LogMessage, ValidationErrorLogMessage } from '@src/core/logger/types/logging.types';

export class UserLoginMigrationNotFoundLoggableException extends NotFoundException implements Loggable {
	constructor(private readonly schoolId: EntityId, private readonly userLoginMigrationId?: EntityId) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
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
