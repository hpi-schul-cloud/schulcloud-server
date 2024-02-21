import { BadRequestException } from '@nestjs/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class InvalidOriginForLogoutUrlLoggableException extends BadRequestException implements Loggable {
	constructor(private readonly logoutUrl: string, private readonly origin: string | undefined) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'INVALID_ORIGIN_FOR_LOGOUT_URL',
			message: 'The provided logoutUrl is from the wrong domain. Only URLs from the origin of the request can be used.',
			stack: this.stack,
			data: {
				received: new URL(this.logoutUrl).origin,
				expected: this.origin,
			},
		};
	}
}
