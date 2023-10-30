import { Loggable } from '@src/core/logger/interfaces/loggable';
import { ErrorLogMessage, LogMessage, ValidationErrorLogMessage } from '@src/core/logger/types/logging.types';

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
