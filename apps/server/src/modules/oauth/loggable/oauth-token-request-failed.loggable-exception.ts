import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class OauthTokenRequestFailedLoggableException extends BusinessError implements Loggable {
	constructor() {
		super(
			{
				type: 'OAUTH_TOKEN_REQUEST_FAILED',
				title: 'OAuth token request failed.',
				defaultMessage: 'OAuth token request failed.',
			},
			HttpStatus.BAD_REQUEST
		);
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'OAUTH_TOKEN_REQUEST_FAILED',
			message: 'OAuth token request failed.',
			stack: this.stack,
		};
	}
}
