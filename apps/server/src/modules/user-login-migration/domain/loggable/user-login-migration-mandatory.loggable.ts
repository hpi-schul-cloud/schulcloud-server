import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type EntityId } from '@shared/domain/types';

export class UserLoginMigrationMandatoryLoggable implements Loggable {
	constructor(
		private readonly userId: EntityId,
		private readonly userLoginMigrationId: EntityId | undefined,
		private readonly mandatory: boolean
	) {}

	public getLogMessage(): LoggableMessage {
		return {
			message: 'The school administrator changed the requirement status of the user login migration for his school.',
			data: {
				userId: this.userId,
				userLoginMigrationId: this.userLoginMigrationId,
				mandatory: this.mandatory,
			},
		};
	}
}
