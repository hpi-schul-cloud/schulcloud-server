import { ErrorLogMessage, Loggable } from '@infra/logger';
import { BadRequestException } from '@nestjs/common';

export class InvalidTokenLoggableException extends BadRequestException implements Loggable {
	public getLogMessage(): ErrorLogMessage {
		return {
			type: 'INVALID_TOKEN',
			stack: this.stack,
		};
	}
}
