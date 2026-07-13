import { type SchulconnexLaufzeitResponse } from '@infra/schulconnex-client';
import { InternalServerErrorException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class InvalidLaufzeitResponseLoggableException extends InternalServerErrorException implements Loggable {
	constructor(private readonly laufzeit: SchulconnexLaufzeitResponse) {
		super();
	}

	public getLogMessage(): LoggableMessage {
		return {
			type: 'INVALID_LAUFZEIT_RESPONSE',
			stack: this.stack,
			data: {
				laufzeit: { ...this.laufzeit },
			},
		};
	}
}
