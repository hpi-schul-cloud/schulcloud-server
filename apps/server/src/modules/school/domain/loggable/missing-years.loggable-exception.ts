import { ErrorLogMessage, Loggable } from '@infra/logger';
import { InternalServerErrorException } from '@nestjs/common';

export class MissingYearsLoggableException extends InternalServerErrorException implements Loggable {
	constructor() {
		super('There must exist at least three school years: last, active and next.');
	}

	getLogMessage(): ErrorLogMessage {
		const message = {
			message: this.message,
			type: 'INTERNAL_SERVER_ERROR',
			stack: this.stack,
		};

		return message;
	}
}
