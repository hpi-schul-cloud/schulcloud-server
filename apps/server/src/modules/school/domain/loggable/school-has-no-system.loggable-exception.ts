import { NotFoundException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type EntityId } from '@shared/domain/types';
import { SchoolErrorEnum } from './error.enum';

export class SchoolHasNoSystemLoggableException extends NotFoundException implements Loggable {
	constructor(
		private readonly schoolId: EntityId,
		private readonly systemId: EntityId
	) {
		super({
			type: SchoolErrorEnum.SCHOOL_HAS_NO_SYSTEM,
		});
	}

	getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
			type: SchoolErrorEnum.SCHOOL_HAS_NO_SYSTEM,
			stack: this.stack,
			data: {
				schoolId: this.schoolId,
				systemId: this.systemId,
			},
		};

		return message;
	}
}
