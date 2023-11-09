import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class HydraOauthLoggableException extends HttpException implements Loggable {
	constructor(
		private readonly url: string,
		private readonly method: string,
		private readonly errorMessage: string,
		private readonly errorStatusCode: number
	) {
		super(errorMessage, errorStatusCode);
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'HYDRA_OAUTH_ERROR',
			message: 'Hydra oauth error occurred',
			stack: this.stack,
			data: {
				url: this.url,
				method: this.method,
			},
		};
	}
}
