import { InternalServerErrorException } from '@nestjs/common';
import { ErrorLogMessage, Loggable } from '@src/core/logger';

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

	getLogMessage(): ErrorLogMessage {
		const message: ErrorLogMessage = {
			type: 'INTERNAL_SERVER_ERROR',
			stack: this.stack,
			data: {
				userId: this.userId,
				systemId: this.systemId,
				externalSystemResponse: this.externalSystemResponse,
			},
		};

		return message;
	}
}
