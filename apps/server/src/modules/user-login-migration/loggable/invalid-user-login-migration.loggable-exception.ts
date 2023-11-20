import { UnprocessableEntityException } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class InvalidUserLoginMigrationLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(private readonly userId: EntityId, private readonly targetSystemId: EntityId) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'INVALID_USER_LOGIN_MIGRATION',
			message: 'The migration cannot be started, because there is no migration to the selected target system.',
			stack: this.stack,
			data: {
				userId: this.userId,
				targetSystemId: this.targetSystemId,
			},
		};
	}
}
