import { BadRequestException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class InvalidTokenLoggableException extends BadRequestException implements Loggable {
	public getLogMessage(): LoggableMessage {
		return {
			type: 'INVALID_TOKEN',
			stack: this.stack,
		};
	}
}
