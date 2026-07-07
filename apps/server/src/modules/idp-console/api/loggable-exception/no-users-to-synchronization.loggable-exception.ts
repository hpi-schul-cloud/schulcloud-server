import { InternalServerErrorException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class NoUsersToSynchronizationLoggableException extends InternalServerErrorException implements Loggable {
	constructor(private readonly systemId: string) {
		super();
	}

	getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
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
