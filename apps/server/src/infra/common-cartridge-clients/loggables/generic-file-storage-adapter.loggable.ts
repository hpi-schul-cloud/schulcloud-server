import { Loggable, LoggableMessage, LogMessage } from '@shared/common/loggable';

export class GenericFileStorageLoggable implements Loggable {
	constructor(
		private readonly message: string,
		private readonly data?: LogMessage['data']
	) {}

	public getLogMessage(): LoggableMessage {
		return {
			message: this.message,
			data: this.data,
		};
	}
}
