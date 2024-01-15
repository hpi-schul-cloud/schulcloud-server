import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class MongoTransactionErrorLoggable implements Loggable {
	private error: Error | undefined;

	constructor(private readonly err: unknown) {
		if (err instanceof Error) {
			this.error = err;
		}
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: `Error while saving transaction`,
			type: `MONGO_TRANSACTION_ERROR`,
			error: this.error,
		};
	}
}
