import { InternalServerErrorException } from '@nestjs/common';
import { Loggable } from '@src/core/logger/interfaces';
import { ErrorLogMessage } from '@src/core/logger/types';

export class NoUsersToSynchronizationLoggableException extends InternalServerErrorException implements Loggable {
	constructor(private readonly systemId: string) {
		super();
	}

	getLogMessage(): ErrorLogMessage {
		const message: ErrorLogMessage = {
			type: 'SYNCHRONIZATION_ERROR',
			stack: this.stack,
			data: {
				systemId: this.systemId,
				errorMessage: 'No users to check from system',
			},
		};

		return message;
	}
}
