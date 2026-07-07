import { UnprocessableEntityException } from '@nestjs/common';
import { Loggable, LoggableMessage } from '@shared/common/loggable';
import { EntityId } from '@shared/domain/types';

export class UserNotMigratedLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(private readonly userId?: EntityId) {
		super();
	}

	getLogMessage(): LoggableMessage {
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
