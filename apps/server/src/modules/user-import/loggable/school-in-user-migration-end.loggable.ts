import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class SchoolInUserMigrationEndLoggable implements Loggable {
	constructor(private readonly schoolName: string) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'Migration for school is completed',
			data: {
				schoolName: this.schoolName,
			},
		};
	}
}
