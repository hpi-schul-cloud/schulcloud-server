import { InternalServerErrorException } from '@nestjs/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';

export class EndSessionEndpointNotFoundLoggableException extends InternalServerErrorException implements Loggable {
	constructor(private readonly systemId: string) {
		super({
			type: 'INTERNAL_SERVER_ERROR',
			title: 'End session endpoint could not be found',
			defaultMessage: `End session endpoint for system ${systemId} could not be found`,
		});
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'INTERNAL_SERVER_ERROR',
			stack: this.stack,
			message: `End session endpoint for system ${this.systemId} could not be found`,
			data: {
				systemId: this.systemId,
			},
		};
	}
}
