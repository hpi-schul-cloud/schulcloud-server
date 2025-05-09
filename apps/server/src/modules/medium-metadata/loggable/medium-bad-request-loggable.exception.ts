import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { BadRequestException } from '@nestjs/common';

export class MediumBadRequestLoggableException extends BadRequestException implements Loggable {
	constructor(private readonly mediumId: string, private readonly sourceId: string) {
		super();
	}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: `Media provider responded with bad request response.`,
			data: {
				sourceId: this.sourceId,
				mediumId: this.mediumId,
			},
		};
	}
}
