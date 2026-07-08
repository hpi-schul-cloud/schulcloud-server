import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type EntityId } from '@shared/domain/types';
import { type UserLoginMigrationDO } from '../../do';

export class UserMigrationStartedLoggable implements Loggable {
	constructor(
		private readonly userId: EntityId,
		private readonly userLoginMigration: UserLoginMigrationDO
	) {}

	getLogMessage(): LoggableMessage {
		return {
			message: 'A user started the user login migration.',
			data: {
				userId: this.userId,
				userLoginMigrationId: this.userLoginMigration.id,
			},
		};
	}
}
