import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class WsSharedDocErrorLoggable implements Loggable {
	private error: Error | undefined;

	constructor(private readonly docName: string, private readonly message: string, private readonly err: unknown) {
		if (err instanceof Error) {
			this.error = err;
		}
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: `Error in document ${this.docName}: ${this.message}`,
			type: `WSSHAREDDOC_ERROR`,
			error: this.error,
		};
	}
}
