import { NotFoundException } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { Loggable } from '@src/core/logger/interfaces';
import { ErrorLogMessage } from '@src/core/logger/types';

export class NotFoundLoggableException extends NotFoundException implements Loggable {
	constructor(
		private readonly resourceName: string,
		private readonly identifierName: string,
		private readonly resourceId: EntityId
	) {
		super();
	}

	getLogMessage(): ErrorLogMessage {
		const message: ErrorLogMessage = {
			type: 'NOT_FOUND',
			stack: this.stack,
			data: {
				resourceName: this.resourceName,
				[this.identifierName]: this.resourceId,
			},
		};

		return message;
	}
}
