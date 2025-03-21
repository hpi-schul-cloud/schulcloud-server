import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';

export class BiloMediaMetadataSyncFailedLoggable implements Loggable {
	constructor(private readonly mediumId: string, private readonly mediaSourceId: string) {}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		const logMessage: LogMessage = {
			message: `Metadata Synchronization for mediumId: ${this.mediumId} and mediaSourceId: ${this.mediaSourceId} failed.`,
			data: {
				mediumId: this.mediumId,
				mediaSourceId: this.mediaSourceId,
			},
		};

		return logMessage;
	}
}
