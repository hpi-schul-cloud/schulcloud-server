import { InternalServerErrorException } from '@nestjs/common';
import { Loggable, LoggableMessage } from '@shared/common/loggable';

export class InvalidLernperiodeResponseLoggableException extends InternalServerErrorException implements Loggable {
	constructor(private readonly lernperiode: string) {
		super();
	}

	getLogMessage(): LoggableMessage {
		return {
			type: 'INVALID_LERNPERIODE_RESPONSE',
			stack: this.stack,
			data: {
				lernperiode: this.lernperiode,
			},
		};
	}
}
