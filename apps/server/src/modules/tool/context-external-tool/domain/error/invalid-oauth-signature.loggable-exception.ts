import { BadRequestException } from '@nestjs/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';

export class InvalidOauthSignatureLoggableException extends BadRequestException implements Loggable {
	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		const message: LogMessage | ErrorLogMessage | ValidationErrorLogMessage = {
			type: 'INVALID_OAUTH_SIGNATURE',
			message: 'The oauth signature is invalid.',
			stack: this.stack,
		};

		return message;
	}
}
