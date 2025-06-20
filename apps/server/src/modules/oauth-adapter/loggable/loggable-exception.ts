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
		let { error } = this;
		if (isAxiosError(this.error)) {
			error = new AxiosErrorLoggable(this.error, 'O_AUTH_ADAP_3RD_PARTY_ERROR');
		}
		const message: ErrorLogMessage = {
			type: 'O_AUTH_ADAPTER_ERROR',
			stack: this.stack,
			data: {
				errorMessage: this.errorMessage,
			},
			error,
		};

		return message;
	}
}
