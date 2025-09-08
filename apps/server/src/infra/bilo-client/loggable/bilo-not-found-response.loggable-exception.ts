import { ErrorLogMessage, Loggable } from '@core/logger';
import { NotFoundException } from '@nestjs/common';

export class BiloNotFoundResponseLoggableException extends NotFoundException implements Loggable {
	constructor() {
		super();
	}

	public getLogMessage(): ErrorLogMessage {
		return {
			type: 'BILDUNGSLOGIN_NOT_FOUND_RESPONSE',
			stack: this.stack,
			data: {
				message: 'BILDUNGSLOGIN not found response.',
			},
		};
	}
}
