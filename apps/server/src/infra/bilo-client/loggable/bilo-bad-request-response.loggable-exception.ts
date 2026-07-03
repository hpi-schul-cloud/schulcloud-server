import { BadRequestException } from '@nestjs/common';
import { Loggable, LoggableMessage } from '@shared/common/loggable';

export class BiloBadRequestResponseLoggableException extends BadRequestException implements Loggable {
	constructor() {
		super();
	}

	public getLogMessage(): LoggableMessage {
		return {
			type: 'BILDUNGSLOGIN_BAD_REQUEST_RESPONSE',
			stack: this.stack,
			data: {
				message: 'BILDUNGSLOGIN bad request response.',
			},
		};
	}
}
