import { RequestTimeoutException } from '@nestjs/common';
import { Loggable } from '@src/core/logger/interfaces';
import { ErrorLogMessage } from '@src/core/logger/types';

export class RequestTimeoutLoggableException extends RequestTimeoutException implements Loggable {
	constructor(private readonly url: string) {
		super();
	}

	getLogMessage(): ErrorLogMessage {
		const message: ErrorLogMessage = {
			type: 'REQUEST_TIMEOUT',
			stack: this.stack,
			data: {
				url: this.url,
			},
		};

		return message;
	}
}
