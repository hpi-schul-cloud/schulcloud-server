import { Loggable } from '@src/core/logger/interfaces/loggable';
import { ErrorLogMessage, LogMessage, ValidationErrorLogMessage } from '@src/core/logger/types/logging.types';

export class UserMigrationIsNotEnabled implements Loggable {
	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'Feature flag of user migration may be disable or the school is not an LDAP pilot',
		};
	}
}
