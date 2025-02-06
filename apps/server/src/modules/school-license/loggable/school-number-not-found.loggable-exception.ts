import { NotFoundException } from '@nestjs/common';
import { ErrorLogMessage, LogMessage, ValidationErrorLogMessage } from '@core/logger';

export class SchoolNumberNotFoundLoggableException extends NotFoundException {
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
