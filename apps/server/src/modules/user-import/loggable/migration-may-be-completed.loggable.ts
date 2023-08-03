import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class MigrationMayBeCompleted implements Loggable {
	constructor(private readonly inUserMigration?: boolean) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'The migration may have already been completed or the school may not yet be in maintenance mode',
			data: {
				inUserMigration: this.inUserMigration,
			},
		};
	}
}
