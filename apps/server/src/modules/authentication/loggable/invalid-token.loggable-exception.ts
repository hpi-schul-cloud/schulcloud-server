import { BadRequestException } from '@nestjs/common';
import { Loggable, LoggableMessage } from '@shared/common/loggable';

export class InvalidTokenLoggableException extends BadRequestException implements Loggable {
	public getLogMessage(): LoggableMessage {
		return {
			type: 'INVALID_TOKEN',
			stack: this.stack,
		};
	}
}
