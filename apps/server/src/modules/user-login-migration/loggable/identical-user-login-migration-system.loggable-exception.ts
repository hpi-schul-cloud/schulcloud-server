import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { BusinessError } from '@shared/common';
import { EntityId } from '@shared/domain/types';
import { HttpStatus } from '@nestjs/common';

export class IdenticalUserLoginMigrationSystemLoggableException extends BusinessError implements Loggable {
	constructor(private readonly schoolId: string | undefined, private readonly targetSystemId: EntityId | undefined) {
		super(
			{
				type: 'IDENTICAL_USER_LOGIN_MIGRATION_SYSTEM',
				title: 'Identical user login migration system',
				defaultMessage:
					'The migration cannot be started, because the target system and current schools login system are the same.',
			},
			HttpStatus.INTERNAL_SERVER_ERROR,
			{
				schoolId,
				targetSystemId,
			}
		);
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: this.type,
			message: this.message,
			stack: this.stack,
			data: {
				schoolId: this.schoolId,
				targetSystemId: this.targetSystemId,
			},
		};
	}
}
