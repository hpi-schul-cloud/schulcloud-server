import { BadRequestException } from '@nestjs/common';
import { Loggable, LoggableMessage } from '@shared/common/loggable';

export class InvalidLinkUrlLoggableException extends BadRequestException implements Loggable {
	constructor(
		private readonly url: string,
		readonly message: string
	) {
		super();
	}

	getLogMessage(): LoggableMessage {
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
