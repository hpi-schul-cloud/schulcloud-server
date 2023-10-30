import { BadRequestException } from '@nestjs/common';
import { Loggable } from '@src/core/logger/interfaces/loggable';
import { ErrorLogMessage, LogMessage, ValidationErrorLogMessage } from '@src/core/logger/types/logging.types';

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
