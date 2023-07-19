import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class UserMigrationIsNotEnable implements Loggable {
	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'feature flag of user migration may be disable or the school is not an LDAP pilot',
		};
	}
}
