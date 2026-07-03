import { Loggable, LogMessage, LogMessageData } from '@infra/logger';

export class GenericFileStorageLoggable implements Loggable {
	constructor(
		private readonly message: string,
		private readonly data?: LogMessageData
	) {}

	public getLogMessage(): LogMessage {
		return {
			message: this.message,
			data: this.data,
		};
	}
}
