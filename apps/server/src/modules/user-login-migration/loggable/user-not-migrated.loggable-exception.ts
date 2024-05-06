import { UnprocessableEntityException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class UserNotMigratedLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(private readonly userId?: EntityId) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'USER_NOT_MIGRATED',
			message: 'The user has not migrated yet.',
			stack: this.stack,
			data: {
				userId: this.userId,
			},
		};
	}
}
