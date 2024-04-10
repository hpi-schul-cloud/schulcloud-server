import { InternalServerErrorException } from '@nestjs/common';
import { Loggable } from '@src/core/logger/interfaces';
import { ErrorLogMessage } from '@src/core/logger/types';

export class SynchronizationUnknownErrorLoggableException extends InternalServerErrorException implements Loggable {
	constructor(private readonly systemId: string) {
		super();
	}

	getLogMessage(): ErrorLogMessage {
		const message: ErrorLogMessage = {
			type: 'SYNCHRONIZATION_ERROR',
			stack: this.stack,
			data: {
				systemId: this.systemId,
				errorMessage:
					'Unknown error occurred during synchronization process of users provisioned by an external system',
			},
		};

		return message;
	}
}
