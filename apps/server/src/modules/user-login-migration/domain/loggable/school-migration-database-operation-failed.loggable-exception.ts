import { ErrorUtils } from '@infra/error';
import { type LegacySchoolDo } from '@modules/legacy-school/domain';
import { InternalServerErrorException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

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

	public getLogMessage(): LoggableMessage {
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
