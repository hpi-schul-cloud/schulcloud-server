import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { NotFoundException } from '@nestjs/common';

export class SchoolNumberNotFoundLoggableException extends NotFoundException implements Loggable {
	constructor(private readonly schoolId: string) {
		super();
	}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'Required school number for media school licenses request is missing.',
			data: {
				schoolId: this.schoolId,
			},
		};
	}
}
