import { NotFoundException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class MediaSourceDataFormatNotFoundLoggableException extends NotFoundException implements Loggable {
	public getLogMessage(): LoggableMessage {
		return {
			message: `Media source data format is missing.`,
		};
	}
}
