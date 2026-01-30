import { ErrorLogMessage, Loggable, LogMessage, LogMessageDataObject, ValidationErrorLogMessage } from '@core/logger';

export class NotificationLoggable implements Loggable {
	constructor(private readonly message: string, private readonly data?: LogMessageDataObject) {}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'COMMON_CARTRIDGE_IMPORT_MESSAGE_NOTIFICATION',
			message: this.message,
			data: this.data,
		};
	}
}
