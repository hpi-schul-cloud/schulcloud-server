import { AxiosErrorLoggable } from '@core/error/loggable';
import { Loggable } from '@core/logger';
import { ErrorLogMessage } from '@core/logger/types';
import { InternalServerErrorException } from '@nestjs/common';
import { isAxiosError } from 'axios';
export class DeletionErrorLoggableException extends InternalServerErrorException implements Loggable {
	constructor(private readonly errorMessage: string, private readonly error?: Error) {
		super();
	}

	public getLogMessage(): ErrorLogMessage {
		const error = isAxiosError(this.error)
			? new AxiosErrorLoggable(this.error, 'DELETION_3RD_PARTY_ERROR')
			: this.error;
		const message: ErrorLogMessage = {
			type: 'DELETION_ERROR',
			stack: this.stack,
			data: {
				errorMessage: this.errorMessage,
			},
			error,
		};

		return message;
	}
}
