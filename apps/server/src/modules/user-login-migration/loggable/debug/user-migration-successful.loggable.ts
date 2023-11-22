import { EntityId } from '@shared/domain';
import { UserLoginMigrationDO } from '@shared/domain/domainobject';
import { Loggable, LogMessage } from '@src/core/logger';

export class UserMigrationSuccessfulLoggable implements Loggable {
	constructor(private readonly userId: EntityId, private readonly userLoginMigration: UserLoginMigrationDO) {}

	getLogMessage(): LogMessage {
		return {
			message: 'A user has successfully migrated.',
			data: {
				userId: this.userId,
				userLoginMigrationId: this.userLoginMigration.id,
			},
		};
	}
}
