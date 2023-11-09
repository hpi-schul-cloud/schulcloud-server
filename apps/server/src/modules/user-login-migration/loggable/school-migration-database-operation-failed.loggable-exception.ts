import { InternalServerErrorException } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { ErrorUtils } from '@src/core/error/utils';
import { ErrorLogMessage, Loggable } from '@src/core/logger';

export class SchoolMigrationDatabaseOperationFailedLoggableException
	extends InternalServerErrorException
	implements Loggable
{
	// TODO: Remove undefined type from schoolId when using the new School DO
	constructor(private readonly schoolId: EntityId | undefined, error: unknown) {
		super(ErrorUtils.createHttpExceptionOptions(error));
	}

	public getLogMessage(): ErrorLogMessage {
		return {
			type: 'SCHOOL_LOGIN_MIGRATION_DATABASE_OPERATION_FAILED',
			stack: this.stack,
			data: {
				schoolId: this.schoolId,
			},
		};
	}
}
