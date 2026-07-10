import { UnprocessableEntityException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type EntityId } from '@shared/domain/types';

export class UserLoginMigrationAlreadyClosedLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(
		private readonly closedAt: Date,
		private readonly userLoginMigrationId?: EntityId
	) {
		super();
	}

	public getLogMessage(): LoggableMessage {
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
