import { InternalServerErrorException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class MissingYearsLoggableException extends InternalServerErrorException implements Loggable {
	constructor() {
		super('There must exist at least three school years: last, active and next.');
	}

	public getLogMessage(): LoggableMessage {
		const message = {
			message: this.message,
			type: 'INTERNAL_SERVER_ERROR',
			stack: this.stack,
		};

		return message;
	}
}
