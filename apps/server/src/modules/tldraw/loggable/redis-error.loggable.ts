import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class RedisErrorLoggable implements Loggable {
	private error: Error | undefined;

	constructor(private readonly connectionType: 'PUB' | 'SUB', private readonly err: unknown) {
		if (err instanceof Error) {
			this.error = err;
		}
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: `Redis ${this.connectionType} error`,
			type: `REDIS_${this.connectionType}_ERROR`,
			error: this.error,
		};
	}
}
