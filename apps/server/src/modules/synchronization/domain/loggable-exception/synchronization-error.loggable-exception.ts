import { InternalServerErrorException } from '@nestjs/common';
import { Loggable } from '@src/core/logger/interfaces';
import { ErrorLogMessage } from '@src/core/logger/types';

export class SynchronizationErrorLoggableException extends InternalServerErrorException implements Loggable {
	constructor(private readonly errorMessage: string, private readonly systemId?: string) {
		super();
	}

	getLogMessage(): ErrorLogMessage {
		const message: ErrorLogMessage = {
			type: 'SYNCHRONIZATION_ERROR',
			stack: this.stack,
			data: {
				systemId: this.systemId,
				errorMessage: this.errorMessage,
			},
		};

		return message;
	}
}
