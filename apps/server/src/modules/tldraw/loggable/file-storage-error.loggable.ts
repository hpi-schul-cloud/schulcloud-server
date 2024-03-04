import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class FileStorageErrorLoggable implements Loggable {
	private error: Error | undefined;

	constructor(private readonly docName: string, private readonly err: unknown) {
		if (err instanceof Error) {
			this.error = err;
		}
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: `Error in document ${this.docName}: assets could not be synchronized with file storage.`,
			type: `FILE_STORAGE_GENERAL_ERROR`,
			error: this.error,
		};
	}
}
