import { ErrorLogMessage, Loggable } from '@core/logger';
import { BadRequestException } from '@nestjs/common';

export class BiloBadRequestResponseLoggableException extends BadRequestException implements Loggable {
	constructor() {
		super();
	}

	public getLogMessage(): ErrorLogMessage {
		return {
			type: 'BILDUNGSLOGIN_BAD_REQUEST_RESPONSE',
			stack: this.stack,
			data: {
				message: 'BILDUNGSLOGIN bad request response.',
			},
		};
	}
}
