import { AxiosErrorLoggable } from '@core/error/loggable';
import { ErrorLogMessage, Loggable } from '@infra/logger';
import { InternalServerErrorException } from '@nestjs/common';
import { isAxiosError } from 'axios';

export class SynchronizationUnknownErrorLoggableException extends InternalServerErrorException implements Loggable {
	constructor(
		private readonly systemId: string,
		private readonly error?: Error
	) {
		super();
	}

	public getLogMessage(): ErrorLogMessage {
		let { error } = this;
		if (isAxiosError(this.error)) {
			error = new AxiosErrorLoggable(this.error, 'DELETION_3RD_PARTY_ERROR');
		}
		const message: ErrorLogMessage = {
			type: 'SYNCHRONIZATION_ERROR',
			stack: this.stack,
			data: {
				systemId: this.systemId,
				errorMessage:
					'Unknown error occurred during synchronization process of users provisioned by an external system',
			},
			error,
		};

		return message;
	}
}
