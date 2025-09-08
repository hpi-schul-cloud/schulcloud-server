import { ErrorUtils } from '@core/error/utils';
import { ErrorLogMessage, Loggable } from '@core/logger';
import { LegacySchoolDo } from '@modules/legacy-school/domain';
import { InternalServerErrorException } from '@nestjs/common';

export class SchoolMigrationDatabaseOperationFailedLoggableException
	extends InternalServerErrorException
	implements Loggable
{
	// TODO: Remove undefined type from schoolId when using the new School DO
	constructor(
		private readonly school: LegacySchoolDo,
		private readonly operation: 'migration' | 'rollback',
		error: unknown
	) {
		super(ErrorUtils.createHttpExceptionOptions(error));
	}

	public getLogMessage(): ErrorLogMessage {
		return {
			type: 'SCHOOL_LOGIN_MIGRATION_DATABASE_OPERATION_FAILED',
			stack: this.stack,
			data: {
				schoolId: this.school.id,
				operation: this.operation,
			},
		};
	}
}
