import { Loggable, LogMessage } from '@core/logger';
import { EntityId } from '@shared/domain/types';
import { UserLoginMigrationDO } from '../../domain';

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
