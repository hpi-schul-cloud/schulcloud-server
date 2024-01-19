import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class WebsocketCloseErrorLoggable implements Loggable {
	private error: Error | undefined;

	constructor(private readonly message: string, private readonly err: unknown) {
		if (err instanceof Error) {
			this.error = err;
		}
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: this.message,
			type: `WEBSOCKET_CLOSE_ERROR`,
			error: this.error,
		};
	}
}
