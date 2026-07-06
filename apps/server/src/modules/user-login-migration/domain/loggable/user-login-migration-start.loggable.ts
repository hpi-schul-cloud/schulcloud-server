import { Loggable, LoggableMessage } from '@shared/common/loggable';
import { EntityId } from '@shared/domain/types';

export class UserLoginMigrationStartLoggable implements Loggable {
	constructor(
		private readonly userId: EntityId,
		private readonly userLoginMigrationId: EntityId | undefined
	) {}

	getLogMessage(): LoggableMessage {
		return {
			message: 'The school administrator started the migration for his school.',
			data: {
				userId: this.userId,
				userLoginMigrationId: this.userLoginMigrationId,
			},
		};
	}
}
