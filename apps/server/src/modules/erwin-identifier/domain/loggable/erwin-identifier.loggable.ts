import { ErrorLogMessage, Loggable, LogMessage, LogMessageDataObject, ValidationErrorLogMessage } from '@core/logger';

export class ErwinIdentifierLoggable implements Loggable {
	constructor(private readonly message: string, private readonly data?: LogMessageDataObject) {}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'ERWIN_IDENTIFIER_LOGGABLE',
			message: this.message,
			data: this.data,
		};
	}
}
