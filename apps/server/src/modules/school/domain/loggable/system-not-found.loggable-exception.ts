import { NotFoundException } from '@nestjs/common';
import { Loggable, LoggableMessage } from '@shared/common/loggable';
import { EntityId } from '@shared/domain/types';
import { SchoolErrorEnum } from './error.enum';

export class SystemNotFoundLoggableException extends NotFoundException implements Loggable {
	constructor(private readonly systemId: EntityId) {
		super({
			type: SchoolErrorEnum.SYSTEM_NOT_FOUND,
		});
	}

	getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
			type: SchoolErrorEnum.SYSTEM_NOT_FOUND,
			stack: this.stack,
			data: {
				systemId: this.systemId,
			},
		};

		return message;
	}
}
