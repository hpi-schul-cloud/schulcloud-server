import { type Loggable, type LogMessage } from '@shared/common/loggable';
import { type EntityId } from '@shared/domain/types';
import { type UserLoginMigrationDO } from '../../do';

export class UserMigrationCorrectionSuccessfulLoggable implements Loggable {
	constructor(
		private readonly userId: EntityId,
		private readonly userLoginMigration: UserLoginMigrationDO
	) {}

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
