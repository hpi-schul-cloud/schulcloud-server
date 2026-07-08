import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type EntityId } from '@shared/domain/types';

export class SchoolInUserMigrationStartLoggable implements Loggable {
	constructor(
		private readonly userId: EntityId,
		private readonly schoolName: string,
		private readonly useCentralLdap: boolean
	) {}

	getLogMessage(): LoggableMessage {
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
