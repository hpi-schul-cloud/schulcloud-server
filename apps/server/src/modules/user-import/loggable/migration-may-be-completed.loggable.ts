import { Loggable, LoggableMessage } from '@shared/common/loggable';

export class MigrationMayBeCompleted implements Loggable {
	constructor(private readonly inUserMigration?: boolean) {}

	getLogMessage(): LoggableMessage {
		return {
			message: 'The migration may have already been completed or the school may not yet be in maintenance mode',
			data: {
				inUserMigration: this.inUserMigration,
			},
		};
	}
}
