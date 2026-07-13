import { BadRequestException, type HttpExceptionOptions } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class LdapUserMigrationException extends BadRequestException {}

export class LdapAlreadyPersistedException extends LdapUserMigrationException implements Loggable {
	constructor(descriptionOrOptions?: string | HttpExceptionOptions) {
		super('ldapAlreadyPersisted', descriptionOrOptions);
	}

	public getLogMessage(): LoggableMessage {
		return {
			message: 'LDAP is already Persisted',
		};
	}
}
export class MissingSchoolNumberException extends LdapUserMigrationException implements Loggable {
	constructor(descriptionOrOptions?: string | HttpExceptionOptions) {
		super('LDAP migration Exception', descriptionOrOptions);
	}

	public getLogMessage(): LoggableMessage {
		return {
			message: 'The school is missing a official school number',
		};
	}
}
export class MigrationAlreadyActivatedException extends LdapUserMigrationException implements Loggable {
	constructor(descriptionOrOptions?: string | HttpExceptionOptions) {
		super('LDAP migration Exception', descriptionOrOptions);
	}

	public getLogMessage(): LoggableMessage {
		return {
			message: 'Migration is already activated for this school',
		};
	}
}
