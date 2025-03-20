import { ErrorLogMessage, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { ValidationError } from 'class-validator';

export class ValidationErrorLoggableException extends ValidationError {
	constructor(private readonly mediumId: string, private readonly mediaSourceId: string) {
		super();
	}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: `Metadata Synchronization for mediumId: ${this.mediumId} and mediaSourceId: ${this.mediaSourceId} failed.`,
			data: {
				mediumId: this.mediumId,
				mediaSourceId: this.mediaSourceId,
			},
		};
	}
}
