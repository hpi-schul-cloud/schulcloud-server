import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { ImportUser } from '../entity';

export class UserMigrationFailedLoggable implements Loggable {
	constructor(private readonly importUser: ImportUser, private readonly error: Error) {}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'USER_MIGRATION_FAILED',
			message: 'An error occurred while migrating a user with the migration wizard.',
			stack: this.error.stack,
			data: {
				externalUserId: this.importUser.externalId,
				userId: this.importUser.user?.id,
				errorName: this.error.name,
				errorMsg: this.error.message,
			},
		};
	}
}
