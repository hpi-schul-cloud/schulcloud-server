import { EntityId } from '@shared/domain/types/entity-id';
import { Loggable } from '@src/core/logger/interfaces/loggable';
import { ErrorLogMessage, LogMessage, ValidationErrorLogMessage } from '@src/core/logger/types/logging.types';

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
