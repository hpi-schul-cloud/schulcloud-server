import { BadRequestException } from '@nestjs/common';
import { Loggable, LoggableMessage } from '@shared/common/loggable';

export class InvalidOauthSignatureLoggableException extends BadRequestException implements Loggable {
	getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
			type: 'INVALID_OAUTH_SIGNATURE',
			message: 'The oauth signature is invalid.',
			stack: this.stack,
		};

		return message;
	}
}
