import { EntityId } from '@shared/domain/types';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class SchoolInUserMigrationStartLoggable implements Loggable {
	constructor(
		private readonly userId: EntityId,
		private readonly schoolName: string,
		private readonly useCentralLdap: boolean
	) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'The school administrator started the migration for his school.',
			data: {
				currentUserId: this.userId,
				schoolName: this.schoolName,
				centralLdap: this.useCentralLdap,
			},
		};
	}
}
