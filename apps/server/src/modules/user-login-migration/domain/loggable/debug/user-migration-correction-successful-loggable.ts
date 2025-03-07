import { LogMessage } from '@core/logger';
import { EntityId } from '@shared/domain/types';
import { UserLoginMigrationDO } from '../../do';

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
