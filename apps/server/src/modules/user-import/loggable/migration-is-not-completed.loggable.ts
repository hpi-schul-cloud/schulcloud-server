import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class MigrationMayNotBeCompleted implements Loggable {
	constructor(private readonly inUserMigration?: boolean) {}

	public getLogMessage(): LoggableMessage {
		return {
			message: 'The migration may not be yet complete or the school may not be in maintenance mode',
			data: {
				inUserMigration: this.inUserMigration,
			},
		};
	}
}
