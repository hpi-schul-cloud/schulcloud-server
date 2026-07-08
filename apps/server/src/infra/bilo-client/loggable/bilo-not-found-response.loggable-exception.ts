import { NotFoundException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class BiloNotFoundResponseLoggableException extends NotFoundException implements Loggable {
	constructor() {
		super();
	}

	public getLogMessage(): LoggableMessage {
		return {
			type: 'BILDUNGSLOGIN_NOT_FOUND_RESPONSE',
			stack: this.stack,
			data: {
				message: 'BILDUNGSLOGIN not found response.',
			},
		};
	}
}
