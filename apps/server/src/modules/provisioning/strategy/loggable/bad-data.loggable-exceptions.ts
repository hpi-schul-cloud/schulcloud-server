import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';
import { ErrorLogMessage, Loggable, LogMessage, LogMessageData, ValidationErrorLogMessage } from '@src/core/logger';

export class BadDataLoggableExceptions extends BusinessError implements Loggable {
	constructor(message?: string, details?: Record<string, unknown>) {
		super(
			{
				type: 'BAD_DATA',
				title: 'Request data is invalid',
				defaultMessage: message || 'Request data is invalid and cannot be processed',
			},
			HttpStatus.BAD_REQUEST,
			details
		);
	}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: this.type,
			message: this.message,
			stack: this.stack,
			data: this.details as LogMessageData,
		};
	}
}
