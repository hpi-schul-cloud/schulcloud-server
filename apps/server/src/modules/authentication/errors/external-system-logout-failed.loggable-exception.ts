import { InternalServerErrorException } from '@nestjs/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { AxiosError } from 'axios';

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

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'INTERNAL_SERVER_ERROR',
			stack: this.stack,
			message: `Request to logout external system ${this.systemId} for user ${this.userId} had failed`,
			data: {
				userId: this.userId,
				systemId: this.systemId,
				axiosError: JSON.stringify({
					status: this.axiosError.status,
					data: this.axiosError.response?.data ?? this.axiosError.message,
				}),
			},
		};
	}
}
