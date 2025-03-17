import { NotFoundException } from '@nestjs/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';

export class MediumMetadataNotFoundLoggableException extends NotFoundException implements Loggable {
	constructor(private readonly mediumId: string, private readonly sourceId: string) {
		super();
	}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: `Medium metadata could not be found.`,
			data: {
				sourceId: this.sourceId,
				mediumId: this.mediumId,
			},
		};
	}
}
