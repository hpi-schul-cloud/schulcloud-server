import { Loggable, LogMessage } from '@src/core/logger';
import { EntityId } from '@shared/domain';

export class UserLoginMigrationLoggable implements Loggable {
	constructor(
		private readonly message: string,
		private readonly schoolId?: EntityId,
		private readonly userId?: EntityId
	) {}

	getLogMessage(): LogMessage {
		return {
			message: this.message,
			data: { schoolId: this.schoolId, userId: this.userId },
		};
	}
}
