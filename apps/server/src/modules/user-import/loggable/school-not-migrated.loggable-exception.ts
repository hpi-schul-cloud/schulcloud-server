import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@infra/logger';
import { UnprocessableEntityException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';

export class SchoolNotMigratedLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(private readonly schoolId: EntityId) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'SCHOOL_NOT_MIGRATED',
			message: 'The school administrator started the migration for his school.',
			stack: this.stack,
			data: {
				schoolId: this.schoolId,
			},
		};
	}
}
