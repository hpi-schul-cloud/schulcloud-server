import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class WebsocketCloseErrorLoggable implements Loggable {
	constructor(private readonly message: string, private readonly error: Error) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: this.message,
			type: `WEBSOCKET_CLOSE_ERROR`,
			error: this.error,
		};
	}
}
