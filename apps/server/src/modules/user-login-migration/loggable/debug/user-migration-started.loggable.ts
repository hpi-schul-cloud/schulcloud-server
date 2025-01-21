import { UserLoginMigrationDO } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { Loggable, LogMessage } from '@core/logger';

export class UserMigrationStartedLoggable implements Loggable {
	constructor(private readonly userId: EntityId, private readonly userLoginMigration: UserLoginMigrationDO) {}

	getLogMessage(): LogMessage {
		return {
			message: 'A user started the user login migration.',
			data: {
				userId: this.userId,
				userLoginMigrationId: this.userLoginMigration.id,
			},
		};
	}
}
