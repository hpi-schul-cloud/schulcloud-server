import { UnprocessableEntityException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type EntityId } from '@shared/domain/types';

export class SchoolNotMigratedLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(private readonly schoolId: EntityId) {
		super();
	}

	getLogMessage(): LoggableMessage {
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
