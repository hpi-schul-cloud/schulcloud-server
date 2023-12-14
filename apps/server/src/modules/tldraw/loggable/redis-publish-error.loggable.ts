import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class RedisPublishError implements Loggable {
	constructor(private readonly type: 'document' | 'awareness', private readonly error: Error) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: `Error while publishing ${this.type} state to Redis`,
			type: `REDIS_PUBLISH_ERROR`,
			error: this.error,
		};
	}
}
