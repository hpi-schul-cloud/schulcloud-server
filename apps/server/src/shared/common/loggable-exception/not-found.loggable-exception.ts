import { NotFoundException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '../loggable/interfaces';

export class NotFoundLoggableException extends NotFoundException implements Loggable {
	constructor(
		private readonly resourceName: string,
		private readonly identifiers: Record<string, string>
	) {
		super();
	}

	public getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
			type: 'NOT_FOUND',
			stack: this.stack,
			data: {
				resourceName: this.resourceName,
				...this.identifiers,
			},
		};

		return message;
	}
}
