import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class UserMigrationIsNotEnabled implements Loggable {
	public getLogMessage(): LoggableMessage {
		return {
			message: 'Feature flag of user migration may be disable or the school is not an LDAP pilot',
		};
	}
}
