import { EntityId } from '@shared/domain/types';
import { UserLoginMigrationDO } from '@shared/domain/domainobject';
import { LogMessage } from '@src/core/logger';

export class UserMigrationCorrectionSuccessfulLoggable {
	constructor(private readonly userId: EntityId, private readonly userLoginMigration: UserLoginMigrationDO) {}

	getLogMessage(): LogMessage {
		return {
			message: 'A user has been successfully corrected.',
			data: {
				userId: this.userId,
				userLoginMigrationId: this.userLoginMigration.id,
			},
		};
	}
}
