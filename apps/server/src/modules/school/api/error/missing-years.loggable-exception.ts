import { InternalServerErrorException } from '@nestjs/common';
import { ErrorLogMessage, Loggable } from '@src/core/logger';

export class MissingYearsLoggableException extends InternalServerErrorException implements Loggable {
	constructor() {
		super('There must at least exist three school years: last, active and next.');
	}

	getLogMessage(): ErrorLogMessage {
		const message: ErrorLogMessage = {
			type: 'INTERNAL_SERVER_ERROR',
			stack: this.stack,
		};

		return message;
	}
}
