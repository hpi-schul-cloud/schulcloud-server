import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { NotFoundException } from '@nestjs/common';

export class MediumNotFoundLoggableException extends NotFoundException implements Loggable {
	constructor(private readonly mediumId: string, private readonly sourceId: string) {
		super();
	}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: `Medium could not be found.`,
			data: {
				sourceId: this.sourceId,
				mediumId: this.mediumId,
			},
		};
	}
}
