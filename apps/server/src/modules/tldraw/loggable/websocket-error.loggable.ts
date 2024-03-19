import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class WebsocketErrorLoggable implements Loggable {
	private error: Error | undefined;

	constructor(private readonly err: unknown) {
		if (err instanceof Error) {
			this.error = err;
		}
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'Websocket error event',
			type: 'WEBSOCKET_ERROR',
			error: this.error,
		};
	}
}
