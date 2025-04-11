import { ErrorLogMessage, LogMessage, ValidationErrorLogMessage } from '@core/logger';

export class MediumNotFoundLoggableException {
	constructor(private readonly mediumId: string, private readonly sourceId: string) {}

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
