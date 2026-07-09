import { UnprocessableEntityException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type EntityId } from '@shared/domain/types';

export class SchoolNumberMissingLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(private readonly schoolId: EntityId) {
		super();
	}

	public getLogMessage(): LoggableMessage {
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
