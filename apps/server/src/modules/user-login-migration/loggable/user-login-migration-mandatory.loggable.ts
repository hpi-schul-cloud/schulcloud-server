import { EntityId } from '@shared/domain';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class UserLoginMigrationMandatoryLoggable implements Loggable {
	constructor(
		private readonly userId: EntityId,
		private readonly userLoginMigrationId: EntityId,
		private readonly mandatory: boolean
	) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
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
