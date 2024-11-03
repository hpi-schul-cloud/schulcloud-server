import { InternalServerErrorException } from '@nestjs/common';
import { ErrorLogMessage, Loggable } from '@src/core/logger';

export class EndSessionEndpointNotFoundLoggableException extends InternalServerErrorException implements Loggable {
	constructor(private readonly systemId: string) {
		super({
			type: 'INTERNAL_SERVER_ERROR',
			title: 'End session endpoint could not be found',
			defaultMessage: `End session endpoint for system ${systemId} could not be found`,
		});
	}

	getLogMessage(): ErrorLogMessage {
		const message: ErrorLogMessage = {
			type: 'INTERNAL_SERVER_ERROR',
			stack: this.stack,
			data: {
				systemId: this.systemId,
			},
		};

		return message;
	}
}
