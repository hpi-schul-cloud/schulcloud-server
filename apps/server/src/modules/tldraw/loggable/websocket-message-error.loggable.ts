import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class WebsocketMessageErrorLoggable implements Loggable {
	private error: Error | undefined;

	constructor(private readonly err: unknown) {
		if (err instanceof Error) {
			this.error = err;
		}
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: `Error while handling websocket message`,
			type: `WEBSOCKET_MESSAGE_ERROR`,
			error: this.error,
		};
	}
}
