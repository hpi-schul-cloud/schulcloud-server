import { ErrorLogMessage, LogMessage, Loggable, ValidationErrorLogMessage } from '@src/core/logger';

export class SynchronizationLoggable implements Loggable {
	constructor(
		private readonly message: string,
		private readonly systemId: string,
		private readonly usersSynchronizedCount?: number
	) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: this.message,
			data: {
				systemId: this.systemId,
				usersSynchronizedCount: this.usersSynchronizedCount,
			},
		};
	}
}
