import { UnprocessableEntityException } from '@nestjs/common';
import { Loggable, LoggableMessage } from '@shared/common/loggable';
import { EntityId } from '@shared/domain/types';

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
