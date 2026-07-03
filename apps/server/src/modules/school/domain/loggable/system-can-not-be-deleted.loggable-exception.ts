import { ErrorLogMessage, Loggable } from '@infra/logger';
import { NotFoundException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
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
