import { Loggable } from '@core/logger';
import { LogMessage } from '@core/logger/types';

export class H5PUcLoggable implements Loggable {
	constructor(private readonly message: string) {}

	// istanbul ignore next
	public getLogMessage(): LogMessage {
		const logMessage = {
			message: this.message,
		};

		return logMessage;
	}
}
