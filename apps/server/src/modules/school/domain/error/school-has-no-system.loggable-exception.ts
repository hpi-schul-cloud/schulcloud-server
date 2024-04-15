import { NotFoundException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { Loggable } from '@src/core/logger/interfaces';
import { ErrorLogMessage } from '@src/core/logger/types';
import { SchoolErrorEnum } from './error.enum';

export class SchoolHasNoSystemLoggableException extends NotFoundException implements Loggable {
	constructor(private readonly schoolId: EntityId, private readonly systemId: EntityId) {
		super({
			type: SchoolErrorEnum.SCHOOL_HAS_NO_SYSTEM,
		});
	}

	getLogMessage(): ErrorLogMessage {
		const message: ErrorLogMessage = {
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
