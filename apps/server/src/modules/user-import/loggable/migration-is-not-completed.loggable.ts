import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class MigrationMayNotBeCompleted implements Loggable {
	constructor(private readonly inUserMigration?: boolean) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'The migration may not be yet complete or the school may not be in maintenance mode',
			data: {
				inUserMigration: this.inUserMigration,
			},
		};
	}
}
