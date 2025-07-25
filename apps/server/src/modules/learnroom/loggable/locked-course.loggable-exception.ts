import { ErrorLogMessage, Loggable } from '@core/logger';
import { ForbiddenException } from '@nestjs/common';

export class LockedCourseLoggableException extends ForbiddenException implements Loggable {
	constructor(private readonly title: string, private readonly id?: string) {
		super(title);
	}

	public getLogMessage(): ErrorLogMessage {
		const message = {
			type: 'LOCKED_COURSE',
			message: this.message,
			stack: this.stack,
			data: {
				id: this.id,
			},
		};

		return message;
	}
}
