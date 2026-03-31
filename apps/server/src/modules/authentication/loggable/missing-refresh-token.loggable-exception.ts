import { Loggable } from '@core/logger/interfaces';
import { ErrorLogMessage } from '@core/logger/types';
import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';

export class MissingRefreshTokenLoggableException extends BusinessError implements Loggable {
	constructor(private readonly systemId: string) {
		super(
			{
				type: 'MISSING_REFRESH_TOKEN',
				title: 'Login has failed because the OAuth provider did not return a refresh token',
				defaultMessage: 'Login has failed because the OAuth provider did not return a refresh token',
			},
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}

	getLogMessage(): ErrorLogMessage {
		const message: ErrorLogMessage = {
			type: this.type,
			stack: this.stack,
			data: {
				systemId: this.systemId,
			},
		};

		return message;
	}
}
