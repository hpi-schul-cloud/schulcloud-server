import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class WebsocketCloseErrorLoggable implements Loggable {
	constructor(private readonly error: Error) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: `Error while closing the websocket connection - it may already be closed`,
			type: `WEBSOCKET_CLOSE_ERROR`,
			error: this.error,
		};
	}
}
