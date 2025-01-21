import { ErrorLogMessage, LogMessage, Loggable, ValidationErrorLogMessage } from '@core/logger';

export class IdmCallbackLoggableException implements Loggable {
	constructor(private readonly callbackError: Error | unknown) {}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		if (this.callbackError instanceof Error) {
			return {
				type: this.callbackError.name,
				message: this.callbackError.message,
				stack: this.callbackError.stack,
			};
		}
		return {
			type: 'CALLBACK_ERROR',
			message: 'error accessing IDM callback',
			data: { callbackError: JSON.stringify(this.callbackError) },
		};
	}
}
