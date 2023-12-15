import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class RedisGeneralErrorLoggable implements Loggable {
	constructor(private readonly connectionType: 'PUB' | 'SUB', private readonly error: Error) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: `Redis ${this.connectionType} error`,
			type: `REDIS_${this.connectionType}_GENERAL_ERROR`,
			error: this.error,
		};
	}
}
