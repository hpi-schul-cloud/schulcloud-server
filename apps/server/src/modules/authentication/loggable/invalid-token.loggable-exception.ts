import { BadRequestException } from '@nestjs/common';
import { Loggable } from '@src/core/logger/interfaces';
import { ErrorLogMessage } from '@src/core/logger/types';

export class InvalidTokenLoggableException extends BadRequestException implements Loggable {
	getLogMessage(): ErrorLogMessage {
		return {
			type: 'INVALID_TOKEN',
			stack: this.stack,
		};
	}
}
