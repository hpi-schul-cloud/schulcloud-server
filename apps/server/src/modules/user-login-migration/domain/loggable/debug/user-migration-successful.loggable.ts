import { Loggable, LoggableMessage } from '@shared/common/loggable';
import { EntityId } from '@shared/domain/types';
import { UserLoginMigrationDO } from '../../do';

export class UserMigrationSuccessfulLoggable implements Loggable {
	constructor(
		private readonly userId: EntityId,
		private readonly userLoginMigration: UserLoginMigrationDO
	) {}

	getLogMessage(): LoggableMessage {
		return {
			message: 'A user has successfully migrated.',
			data: {
				userId: this.userId,
				userLoginMigrationId: this.userLoginMigration.id,
			},
		};
	}
}
