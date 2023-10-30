import { EntityId } from '@shared/domain/types/entity-id';
import { Loggable } from '@src/core/logger/interfaces/loggable';
import { ErrorLogMessage, LogMessage, ValidationErrorLogMessage } from '@src/core/logger/types/logging.types';

export class UserLoginMigrationStartLoggable implements Loggable {
	constructor(private readonly userId: EntityId, private readonly userLoginMigrationId: EntityId) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'The school administrator started the migration for his school.',
			data: {
				userId: this.userId,
				userLoginMigrationId: this.userLoginMigrationId,
			},
		};
	}
}
