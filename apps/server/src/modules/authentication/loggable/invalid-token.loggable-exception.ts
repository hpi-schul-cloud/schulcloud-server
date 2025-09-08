import { BadRequestException } from '@nestjs/common';
import { Loggable } from '@core/logger/interfaces';
import { ErrorLogMessage } from '@core/logger/types';

export class InvalidTokenLoggableException extends BadRequestException implements Loggable {
	getLogMessage(): ErrorLogMessage {
		return {
			type: 'INVALID_TOKEN',
			stack: this.stack,
		};
	}
}
