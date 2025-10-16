import { InternalServerErrorException } from '@nestjs/common';
import { Loggable } from '@core/logger';
import { ErrorLogMessage } from '@core/logger/types';
import { AxiosErrorLoggable } from '@core/error/loggable';
import { isAxiosError } from 'axios';
export class DeletionErrorLoggableException extends InternalServerErrorException implements Loggable {
	constructor(private readonly errorMessage: string, private readonly error?: Error) {
		super();
	}

	public getLogMessage(): ErrorLogMessage {
		let { error } = this;
		if (isAxiosError(this.error)) {
			error = new AxiosErrorLoggable(this.error, 'DELETION_3RD_PARTY_ERROR');
		}
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
