import { UnprocessableEntityException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types/entity-id';
import { Loggable } from '@src/core/logger/interfaces/loggable';
import { ErrorLogMessage, LogMessage, ValidationErrorLogMessage } from '@src/core/logger/types/logging.types';

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
