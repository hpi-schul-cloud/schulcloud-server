import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { ValidationError } from '@shared/common';
import { EntityId } from '@shared/domain/types';

export class IdenticalUserLoginMigrationSystemLoggableException extends ValidationError implements Loggable {
	constructor(private readonly schoolId: string | undefined, private readonly targetSystemId: EntityId | undefined) {
		super('identical_user_login_migration_system: The target system and current schools login system are the same!');
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'IDENTICAL_USER_LOGIN_MIGRATION_SYSTEM',
			message:
				'The migration cannot be started, because the target system and current schools login system are the same!',
			stack: this.stack,
			data: {
				schoolId: this.schoolId,
				targetSystemId: this.targetSystemId,
			},
		};
	}
}
