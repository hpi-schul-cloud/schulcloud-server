import { InternalServerErrorException } from '@nestjs/common';
import { Loggable } from '@src/core/logger/interfaces';
import { ErrorLogMessage } from '@src/core/logger/types';

export class DeletionErrorLoggableException extends InternalServerErrorException implements Loggable {
	constructor(private readonly errorMessage: string) {
		super();
	}

	getLogMessage(): ErrorLogMessage {
		const message: ErrorLogMessage = {
			type: 'DELETION_ERROR',
			stack: this.stack,
			data: {
				errorMessage: this.errorMessage,
			},
		};

		return message;
	}
}
