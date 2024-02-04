import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class CloseConnectionLoggable implements Loggable {
	private error: Error | undefined;

	constructor(private readonly err: unknown) {
		if (err instanceof Error) {
			this.error = err;
		}
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: `Close web socket connection error`,
			type: `CLOSE_WEB_SOCKET_CONNECTION_ERROR`,
			error: this.error,
		};
	}
}
