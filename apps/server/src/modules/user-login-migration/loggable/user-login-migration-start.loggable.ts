import { EntityId } from '@shared/domain/types';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class UserLoginMigrationStartLoggable implements Loggable {
	constructor(private readonly userId: EntityId, private readonly userLoginMigrationId: EntityId | undefined) {}

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
