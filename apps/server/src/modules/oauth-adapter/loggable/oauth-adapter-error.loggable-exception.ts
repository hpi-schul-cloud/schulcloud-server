import { AxiosErrorLoggable } from '@core/error/loggable';
import { Loggable } from '@core/logger';
import { ErrorLogMessage } from '@core/logger/types';
import { InternalServerErrorException } from '@nestjs/common';
import { isAxiosError } from 'axios';
export class OAuthAdapterErrorLoggableException extends InternalServerErrorException implements Loggable {
	constructor(private readonly errorMessage: string, private readonly error?: Error) {
		super();
	}

	public getLogMessage(): ErrorLogMessage {
		const error = isAxiosError(this.error)
			? new AxiosErrorLoggable(this.error, 'OAUTH_ADAP_3RD_PARTY_ERROR')
			: this.error;

		const message: ErrorLogMessage = {
			type: 'OAUTH_ADAPTER_ERROR',
			stack: this.stack,
			data: {
				errorMessage: this.errorMessage,
			},
			error,
		};

		return message;
	}
}
