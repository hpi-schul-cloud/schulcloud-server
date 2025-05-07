import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { UnprocessableEntityException } from '@nestjs/common';

export class MediumUnprocessableResponseLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(private readonly mediumId: string, private readonly sourceId: string) {
		super();
	}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: `Media provider responded with unprocessable response.`,
			data: {
				sourceId: this.sourceId,
				mediumId: this.mediumId,
			},
		};
	}
}
