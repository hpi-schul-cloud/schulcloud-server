import { UnprocessableEntityException } from '@nestjs/common';
import { Loggable, LoggableMessage } from '@shared/common/loggable';
import { EntityId } from '@shared/domain/types';

export class UserLoginMigrationAlreadyClosedLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(
		private readonly closedAt: Date,
		private readonly userLoginMigrationId?: EntityId
	) {
		super();
	}

	getLogMessage(): LoggableMessage {
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
