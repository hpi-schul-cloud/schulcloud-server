import { EntityId } from '@shared/domain/types/entity-id';
import { Loggable } from '@src/core/logger/interfaces/loggable';
import { ErrorLogMessage, LogMessage, ValidationErrorLogMessage } from '@src/core/logger/types/logging.types';

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
