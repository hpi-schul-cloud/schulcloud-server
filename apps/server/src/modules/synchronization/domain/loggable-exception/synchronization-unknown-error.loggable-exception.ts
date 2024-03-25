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
				errorMessage: 'Unknonw error during synchronisation process for users provisioned by system',
			},
		};

		return message;
	}
}
