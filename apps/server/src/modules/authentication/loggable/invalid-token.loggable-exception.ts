import { Loggable } from '@core/logger/interfaces';
import { ErrorLogMessage } from '@core/logger/types';
import { BadRequestException } from '@nestjs/common';

export class InvalidTokenLoggableException extends BadRequestException implements Loggable {
	public getLogMessage(): ErrorLogMessage {
		return {
			type: 'INVALID_TOKEN',
			stack: this.stack,
		};
	}
}
