import { RequestTimeoutException } from '@nestjs/common';
import { Loggable } from '@core/logger/interfaces';
import { ErrorLogMessage } from '@core/logger/types';

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
