import { BadRequestException, HttpExceptionOptions } from '@nestjs/common';
import { ErrorLogMessage, LogMessage, Loggable, ValidationErrorLogMessage } from '@src/core/logger';

export class LdapUserMigrationException extends BadRequestException {}

export class LdapAlreadyPersistedException extends LdapUserMigrationException implements Loggable {
	constructor(descriptionOrOptions?: string | HttpExceptionOptions) {
		super('ldapAlreadyPersisted', descriptionOrOptions);
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'LDAP is already Persisted',
		};
	}
}
export class MissingSchoolNumberException extends LdapUserMigrationException implements Loggable {
	constructor(descriptionOrOptions?: string | HttpExceptionOptions) {
		super('LDAP migration Exception', descriptionOrOptions);
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'The school is missing a official school number',
		};
	}
}
export class MigrationAlreadyActivatedException extends LdapUserMigrationException implements Loggable {
	constructor(descriptionOrOptions?: string | HttpExceptionOptions) {
		super('LDAP migration Exception', descriptionOrOptions);
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'Migration is already activated for this school',
		};
	}
}
