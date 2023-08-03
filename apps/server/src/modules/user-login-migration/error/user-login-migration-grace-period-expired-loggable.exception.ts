import { UnprocessableEntityException } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class UserLoginMigrationGracePeriodExpiredLoggableException
	extends UnprocessableEntityException
	implements Loggable
{
	constructor(private readonly userLoginMigrationId: EntityId, private readonly finishedAt: Date) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
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
