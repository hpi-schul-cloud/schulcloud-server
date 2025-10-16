import { BadRequestException } from '@nestjs/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';

export class InvalidLinkUrlLoggableException extends BadRequestException implements Loggable {
	constructor(private readonly url: string, readonly message: string) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'INVALID_LINK_URL',
			message: this.message,
			stack: this.stack,
			data: {
				url: this.url,
			},
		};
	}
}
