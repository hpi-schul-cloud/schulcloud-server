import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class CloseConnectionLoggable implements Loggable {
	private error: Error | undefined;

	constructor(private readonly errorLocation: string, private readonly err: unknown) {
		if (err instanceof Error) {
			this.error = err;
		}
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: `Close web socket error in ${this.errorLocation}`,
			type: `CLOSE_WEB_SOCKET_ERROR`,
			error: this.error,
		};
	}
}
