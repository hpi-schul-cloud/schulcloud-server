import { EntityId } from '@shared/domain/types';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class UserMigrationRollbackSuccessfulLoggable implements Loggable {
	constructor(
		private readonly userId?: EntityId,
		private readonly externalId?: EntityId,
		private readonly userLoginMigrationId?: EntityId
	) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'The user has been successfully rolled back from the migration.',
			data: {
				userId: this.userId,
				externalId: this.externalId,
				userLoginMigrationId: this.userLoginMigrationId,
			},
		};
	}
}
