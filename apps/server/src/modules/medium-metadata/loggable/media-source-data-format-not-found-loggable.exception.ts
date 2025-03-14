import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { NotFoundException } from '@nestjs/common';

export class MediaSourceDataFormatNotFoundLoggableException extends NotFoundException implements Loggable {
	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: `Media source data format is missing.`,
		};
	}
}
