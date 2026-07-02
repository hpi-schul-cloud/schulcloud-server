import { ErrorLogMessage, Loggable } from '@infra/logger';
import { InternalServerErrorException } from '@nestjs/common';

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
