import { InternalServerErrorException } from '@nestjs/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class ExternalSystemLogoutFailedLoggableException extends InternalServerErrorException implements Loggable {
	constructor(
		private readonly userId: string,
		private readonly systemId: string,
		private readonly externalSystemResponse: string
	) {
		super({
			type: 'INTERNAL_SERVER_ERROR',
			title: 'External system logout failed',
			defaultMessage: `Request to logout external system ${systemId} for user ${userId} had failed`,
		});
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'INTERNAL_SERVER_ERROR',
			stack: this.stack,
			message: `Request to logout external system ${this.systemId} for user ${this.userId} had failed`,
			data: {
				userId: this.userId,
				systemId: this.systemId,
				externalSystemResponse: this.externalSystemResponse,
			},
		};
	}
}
