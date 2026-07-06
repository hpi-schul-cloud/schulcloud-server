import { UnprocessableEntityException } from '@nestjs/common';
import { Loggable, LoggableMessage } from '@shared/common/loggable';
import { EntityId } from '@shared/domain/types';

export class UserLoginMigrationNotActiveLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(private readonly schoolId: EntityId) {
		super();
	}

	getLogMessage(): LoggableMessage {
		return {
			type: 'USER_LOGIN_MIGRATION_NOT_ACTIVE',
			message: 'The user login migration for this school is not active. It is either not started yet or already closed',
			stack: this.stack,
			data: {
				schoolId: this.schoolId,
			},
		};
	}
}
