import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class MongoTransactionError implements Loggable {
	constructor(private readonly error: Error) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: `Error while saving transaction`,
			type: `MONGO_TRANSACTION_ERROR`,
			error: this.error,
		};
	}
}
