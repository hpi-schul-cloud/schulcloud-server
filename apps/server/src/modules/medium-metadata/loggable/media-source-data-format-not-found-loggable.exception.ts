import { NotFoundException } from '@nestjs/common';
import { Loggable, LoggableMessage } from '@shared/common/loggable';

export class MediaSourceDataFormatNotFoundLoggableException extends NotFoundException implements Loggable {
	public getLogMessage(): LoggableMessage {
		return {
			message: `Media source data format is missing.`,
		};
	}
}
