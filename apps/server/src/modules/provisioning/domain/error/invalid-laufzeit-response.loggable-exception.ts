import { ErrorLogMessage, Loggable } from '@infra/logger';
import { SchulconnexLaufzeitResponse } from '@infra/schulconnex-client';
import { InternalServerErrorException } from '@nestjs/common';

export class InvalidLaufzeitResponseLoggableException extends InternalServerErrorException implements Loggable {
	constructor(private readonly laufzeit: SchulconnexLaufzeitResponse) {
		super();
	}

	getLogMessage(): ErrorLogMessage {
		return {
			type: 'INVALID_LAUFZEIT_RESPONSE',
			stack: this.stack,
			data: {
				laufzeit: { ...this.laufzeit },
			},
		};
	}
}
