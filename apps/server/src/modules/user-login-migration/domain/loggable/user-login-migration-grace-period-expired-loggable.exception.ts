import { UnprocessableEntityException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type EntityId } from '@shared/domain/types';

export class UserLoginMigrationGracePeriodExpiredLoggableException
	extends UnprocessableEntityException
	implements Loggable
{
	constructor(
		private readonly userLoginMigrationId: EntityId,
		private readonly finishedAt: Date
	) {
		super();
	}

	public getLogMessage(): LoggableMessage {
		return {
			type: 'USER_LOGIN_MIGRATION_GRACE_PERIOD_EXPIRED',
			message: 'The grace period after finishing the user login migration has expired. It cannot be restarted.',
			stack: this.stack,
			data: {
				userLoginMigrationId: this.userLoginMigrationId,
				finishedAt: this.finishedAt.toISOString(),
			},
		};
	}
}
