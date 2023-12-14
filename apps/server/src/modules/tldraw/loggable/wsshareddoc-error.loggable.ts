import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class WsshareddocErrorLoggable implements Loggable {
	constructor(private readonly docName: string, private readonly message: string, private readonly error: Error) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: `Error in doc ${this.docName}: ${this.message}`,
			type: `WSSHAREDDOC_ERROR`,
			error: this.error,
		};
	}
}
