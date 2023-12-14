import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class WebsocketMessageErrorLoggable implements Loggable {
	constructor(private readonly error: Error) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: `Error while handling websocket message`,
			type: `WEBSOCKET_MESSAGE_ERROR`,
			error: this.error,
		};
	}
}
