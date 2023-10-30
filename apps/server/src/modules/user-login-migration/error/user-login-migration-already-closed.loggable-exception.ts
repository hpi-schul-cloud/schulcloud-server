import { UnprocessableEntityException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types/entity-id';
import { Loggable } from '@src/core/logger/interfaces/loggable';
import { ErrorLogMessage, LogMessage, ValidationErrorLogMessage } from '@src/core/logger/types/logging.types';

export class UserLoginMigrationAlreadyClosedLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(private readonly userLoginMigrationId: EntityId, private readonly closedAt: Date) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'USER_LOGIN_MIGRATION_ALREADY_CLOSED',
			message: 'Migration of school cannot be started or changed, because it is already closed.',
			stack: this.stack,
			data: {
				userLoginMigrationId: this.userLoginMigrationId,
				closedAt: this.closedAt.toISOString(),
			},
		};
	}
}
