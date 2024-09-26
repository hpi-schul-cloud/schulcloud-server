import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class SchoolNameRequiredLoggableException extends BusinessError implements Loggable {
	constructor(private readonly fieldName: string) {
		super(
			{
				type: 'SCHOOL_NAME_REQUIRED',
				title: 'School name is required',
				defaultMessage: 'External school name is required',
			},
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: this.type,
			message: this.message,
			stack: this.stack,
			data: {
				fieldName: this.fieldName,
			},
		};
	}
}
