import { BadRequestException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class InvalidOauthSignatureLoggableException extends BadRequestException implements Loggable {
	public getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
			type: 'INVALID_OAUTH_SIGNATURE',
			message: 'The oauth signature is invalid.',
			stack: this.stack,
		};

		return message;
	}
}
