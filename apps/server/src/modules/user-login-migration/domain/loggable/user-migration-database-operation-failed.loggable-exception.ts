import { InternalServerErrorException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ErrorUtils } from '@core/error/utils';
import { ErrorLogMessage, Loggable } from '@core/logger';

export class UserMigrationDatabaseOperationFailedLoggableException
	extends InternalServerErrorException
	implements Loggable
{
	constructor(private readonly userId: EntityId, private readonly operation: 'migration' | 'rollback', error: unknown) {
		super(ErrorUtils.createHttpExceptionOptions(error));
	}

	public getLogMessage(): ErrorLogMessage {
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
