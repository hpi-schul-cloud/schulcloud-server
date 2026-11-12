import { InternalServerErrorException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type AxiosError } from 'axios';

export class ExternalSystemLogoutFailedLoggableException extends InternalServerErrorException implements Loggable {
	constructor(
		private readonly userId: string,
		private readonly systemId: string,
		private readonly axiosError: AxiosError
	) {
		super({
			type: 'INTERNAL_SERVER_ERROR',
			title: 'External system logout failed',
			defaultMessage: `Request to logout external system ${systemId} for user ${userId} had failed`,
		});
	}

	public getLogMessage(): LoggableMessage {
		return {
			type: 'INTERNAL_SERVER_ERROR',
			stack: this.stack,
			message: `Request to logout external system ${this.systemId} for user ${this.userId} had failed`,
			// The logger keeps only safe fields of axios errors: method, URL, status, code and response body.
			error: this.axiosError,
			data: {
				userId: this.userId,
				systemId: this.systemId,
			},
		};
	}
}
