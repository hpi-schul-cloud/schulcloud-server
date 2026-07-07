import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type EntityId } from '@shared/domain/types';

export class UserMigrationRollbackSuccessfulLoggable implements Loggable {
	constructor(
		private readonly userId?: EntityId,
		private readonly externalId?: EntityId,
		private readonly userLoginMigrationId?: EntityId
	) {}

	getLogMessage(): LoggableMessage {
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
