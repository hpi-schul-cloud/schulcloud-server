import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class WebsocketCloseErrorLoggable implements Loggable {
	private readonly error: Error | undefined;

	constructor(private readonly err: unknown, private readonly message: string) {
		if (err instanceof Error) {
			this.error = err;
		}
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: this.message,
			type: 'WEBSOCKET_CLOSE_ERROR',
			error: this.error,
		};
	}
}
