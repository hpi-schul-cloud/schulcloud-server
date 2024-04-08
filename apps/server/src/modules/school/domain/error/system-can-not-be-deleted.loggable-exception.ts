import { NotFoundException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { Loggable } from '@src/core/logger/interfaces';
import { ErrorLogMessage } from '@src/core/logger/types';
import { SchoolErrorEnum } from './error.enum';

export class SystemCanNotBeDeletedLoggableException extends NotFoundException implements Loggable {
	constructor(private readonly systemId: EntityId) {
		super({
			type: SchoolErrorEnum.SYSTEM_CAN_NOT_BE_DELETED,
		});
	}

	getLogMessage(): ErrorLogMessage {
		const message: ErrorLogMessage = {
			type: SchoolErrorEnum.SYSTEM_CAN_NOT_BE_DELETED,
			stack: this.stack,
			data: {
				systemId: this.systemId,
			},
		};

		return message;
	}
}
