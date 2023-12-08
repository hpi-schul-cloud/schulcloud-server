import { InternalServerErrorException } from '@nestjs/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class EventProcessingFailedLoggableException extends InternalServerErrorException implements Loggable {
	constructor(private readonly eventName: string, private readonly error: Error) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'EVENT_PROCESSING_FAILURE',
			message: 'Event processing failed',
			stack: this.error.stack,
			data: {
				eventName: this.eventName,
			},
		};
	}
}
