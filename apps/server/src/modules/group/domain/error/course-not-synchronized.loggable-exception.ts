import { ErrorLogMessage, Loggable } from '@core/logger';
import { UnprocessableEntityException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';

export class CourseNotSynchronizedLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(private readonly courseId: EntityId) {
		super();
	}

	public getLogMessage(): ErrorLogMessage {
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
