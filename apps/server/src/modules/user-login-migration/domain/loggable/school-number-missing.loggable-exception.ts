import { UnprocessableEntityException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';

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
