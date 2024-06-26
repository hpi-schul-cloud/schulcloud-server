import { InternalServerErrorException } from '@nestjs/common';
import { ErrorLogMessage, Loggable } from '@src/core/logger';

export class InvalidLernperiodeResponseLoggableException extends InternalServerErrorException implements Loggable {
	constructor(private readonly lernperiode: string) {
		super();
	}

	getLogMessage(): ErrorLogMessage {
		return {
			type: 'INVALID_LERNPERIODE_RESPONSE',
			stack: this.stack,
			data: {
				lernperiode: this.lernperiode,
			},
		};
	}
}
