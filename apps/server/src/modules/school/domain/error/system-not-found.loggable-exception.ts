import { NotFoundException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { Loggable } from '@src/core/logger/interfaces';
import { ErrorLogMessage } from '@src/core/logger/types';
import { SchoolErrorEnum } from './error.enum';

export class SystemNotFoundLoggableException extends NotFoundException implements Loggable {
	constructor(private readonly systemId: EntityId) {
		super({
			type: SchoolErrorEnum.SYSTEM_NOT_FOUND,
		});
	}

	getLogMessage(): ErrorLogMessage {
		const message: ErrorLogMessage = {
			type: SchoolErrorEnum.SYSTEM_NOT_FOUND,
			stack: this.stack,
			data: {
				systemId: this.systemId,
			},
		};

		return message;
	}
}
