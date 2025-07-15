import { ForbiddenException } from '@nestjs/common';
import { ErrorLogMessage, Loggable } from '@core/logger';

export class LockedCourseLoggableException extends ForbiddenException implements Loggable {
	constructor(private readonly courseId: string) {
		super('Course is locked');
	}

	public getLogMessage(): ErrorLogMessage {
		const message = {
			type: 'LOCKED_COURSE',
			message: this.message,
			stack: this.stack,
			data: {
				courseId: this.courseId,
			},
		};

		return message;
	}
}
