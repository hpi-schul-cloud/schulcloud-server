import { ErrorUtils } from '@infra/error';
import { InternalServerErrorException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type EntityId } from '@shared/domain/types';

export class UserMigrationDatabaseOperationFailedLoggableException
	extends InternalServerErrorException
	implements Loggable
{
	constructor(
		private readonly userId: EntityId,
		private readonly operation: 'migration' | 'rollback',
		error: unknown
	) {
		super(ErrorUtils.createHttpExceptionOptions(error));
	}

	public getLogMessage(): LoggableMessage {
		return {
			type: 'USER_LOGIN_MIGRATION_DATABASE_OPERATION_FAILED',
			stack: this.stack,
			data: {
				userId: this.userId,
				operation: this.operation,
			},
		};
	}
}
