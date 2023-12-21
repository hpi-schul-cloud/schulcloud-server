import { NotFoundException } from '@nestjs/common';
import { Loggable } from '@src/core/logger/interfaces';
import { ErrorLogMessage } from '@src/core/logger/types';

export class NotFoundLoggableException extends NotFoundException implements Loggable {
	constructor(private readonly resourceName: string, private readonly identifiers: Record<string, string>) {
		super();
	}

	getLogMessage(): ErrorLogMessage {
		const message: ErrorLogMessage = {
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
