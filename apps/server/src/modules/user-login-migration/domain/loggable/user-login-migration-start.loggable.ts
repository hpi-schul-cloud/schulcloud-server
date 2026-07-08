import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type EntityId } from '@shared/domain/types';

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
