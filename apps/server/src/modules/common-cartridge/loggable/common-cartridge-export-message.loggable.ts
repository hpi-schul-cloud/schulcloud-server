import { ErrorLogMessage, Loggable, LogMessage, LogMessageDataObject, ValidationErrorLogMessage } from '@core/logger';

export class CommonCartridgeMessageLoggable implements Loggable {
	constructor(private readonly message: string, private readonly data?: LogMessageDataObject) {}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'COMMON_CARTRIDGE_EXPORT_MESSAGE_LOGGABLE',
			message: this.message,
			data: this.data,
		};
	}
}
