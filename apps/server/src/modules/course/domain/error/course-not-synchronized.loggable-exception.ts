import { UnprocessableEntityException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type EntityId } from '@shared/domain/types';

export class CourseNotSynchronizedLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(private readonly courseId: EntityId) {
		super();
	}

	getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
			type: 'COURSE_NOT_SYNCHRONIZED',
			stack: this.stack,
			data: {
				courseId: this.courseId,
			},
		};

		return message;
	}
}
