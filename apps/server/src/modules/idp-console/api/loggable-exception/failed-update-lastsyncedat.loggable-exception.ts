import { InternalServerErrorException } from '@nestjs/common';
import { Loggable } from '@core/logger/interfaces';
import { ErrorLogMessage } from '@core/logger/types';
import { isAxiosError } from 'axios';
import { AxiosErrorLoggable } from '@core/error/loggable';

export class FailedUpdateLastSyncedAtLoggableException extends InternalServerErrorException implements Loggable {
	constructor(private readonly systemId: string, private readonly error?: Error) {
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
				errorMessage: 'Failed to update lastSyncedAt field for users provisioned by system',
			},
			error,
		};

		return message;
	}
}
