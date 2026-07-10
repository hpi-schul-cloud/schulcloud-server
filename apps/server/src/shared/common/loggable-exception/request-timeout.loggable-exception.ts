import { RequestTimeoutException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '../loggable/interfaces';

export class RequestTimeoutLoggableException extends RequestTimeoutException implements Loggable {
	constructor(private readonly url: string) {
		super();
	}

	public getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
			type: 'REQUEST_TIMEOUT',
			stack: this.stack,
			data: {
				url: this.url,
			},
		};

		return message;
	}
}
