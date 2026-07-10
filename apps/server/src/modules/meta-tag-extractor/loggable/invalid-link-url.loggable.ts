import { BadRequestException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class InvalidLinkUrlLoggableException extends BadRequestException implements Loggable {
	constructor(
		private readonly url: string,
		public readonly message: string
	) {
		super();
	}

	public getLogMessage(): LoggableMessage {
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
