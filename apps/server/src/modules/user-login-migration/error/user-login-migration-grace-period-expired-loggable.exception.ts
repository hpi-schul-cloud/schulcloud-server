import { UnprocessableEntityException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types/entity-id';
import { Loggable } from '@src/core/logger/interfaces/loggable';
import { ErrorLogMessage, LogMessage, ValidationErrorLogMessage } from '@src/core/logger/types/logging.types';

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
