import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class RedisPublishErrorLoggable implements Loggable {
	private error: Error | undefined;

	constructor(private readonly type: 'document' | 'awareness', private readonly err: unknown) {
		if (err instanceof Error) {
			this.error = err;
		}
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: `Error while publishing ${this.type} state to Redis`,
			type: `REDIS_PUBLISH_ERROR`,
			error: this.error,
		};
	}
}
