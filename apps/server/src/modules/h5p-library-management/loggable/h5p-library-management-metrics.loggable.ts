import { Loggable } from '@core/logger';
import { LogMessage, LogMessageData } from '@core/logger/types';

export class H5PLibraryManagementMetricsLoggable implements Loggable {
	constructor(private readonly message: string, private readonly data?: LogMessageData) {}

	// istanbul ignore next
	public getLogMessage(): LogMessage {
		const logMessage = {
			message: this.message,
			data: this.data,
		};

		return logMessage;
	}
}
