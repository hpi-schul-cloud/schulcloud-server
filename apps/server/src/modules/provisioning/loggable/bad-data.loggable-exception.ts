import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';
import { type Loggable, type LoggableMessage, type LogMessage } from '@shared/common/loggable';

export class BadDataLoggableException extends BusinessError implements Loggable {
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

	public getLogMessage(): LoggableMessage {
		return {
			type: this.type,
			message: this.message,
			stack: this.stack,
			data: this.details as LogMessage['data'],
		};
	}
}
