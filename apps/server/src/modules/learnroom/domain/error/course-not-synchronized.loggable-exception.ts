import { UnprocessableEntityException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ErrorLogMessage, Loggable } from '@src/core/logger';

export class CourseNotSynchronizedLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(private readonly courseId: EntityId) {
		super();
	}

	getLogMessage(): ErrorLogMessage {
		const message: ErrorLogMessage = {
			type: 'COURSE_NOT_SYNCHRONIZED',
			stack: this.stack,
			data: {
				courseId: this.courseId,
			},
		};

		return message;
	}
}
