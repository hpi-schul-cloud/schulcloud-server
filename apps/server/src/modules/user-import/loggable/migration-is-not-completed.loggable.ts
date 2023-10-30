import { Loggable } from '@src/core/logger/interfaces/loggable';
import { ErrorLogMessage, LogMessage, ValidationErrorLogMessage } from '@src/core/logger/types/logging.types';

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
