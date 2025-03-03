import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { BadRequestException } from '@nestjs/common';

export class MediaSourceDataFormatMissingLoggableException extends BadRequestException implements Loggable {
	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: `Media source data format is missing.`,
		};
	}
}
