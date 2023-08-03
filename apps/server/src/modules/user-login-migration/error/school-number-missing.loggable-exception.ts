import { UnprocessableEntityException } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class SchoolNumberMissingLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(private readonly schoolId: EntityId) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'SCHOOL_NUMBER_MISSING',
			message: 'The school is missing a official school number.',
			stack: this.stack,
			data: {
				schoolId: this.schoolId,
			},
		};
	}
}
