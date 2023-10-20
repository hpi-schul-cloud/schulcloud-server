import { BadRequestException, HttpExceptionOptions } from '@nestjs/common';

export class LdapUserMigrationException extends BadRequestException {}

export class LdapAlreadyPersistedException extends LdapUserMigrationException {
	constructor(descriptionOrOptions?: string | HttpExceptionOptions) {
		super('ldapAlreadyPersisted', descriptionOrOptions);
	}
}
export class MissingSchoolNumberException extends LdapUserMigrationException {
	constructor(descriptionOrOptions?: string | HttpExceptionOptions) {
		super('ldapAlreadyPersisted', descriptionOrOptions);
	}
}
export class MigrationAlreadyActivatedException extends LdapUserMigrationException {
	constructor(descriptionOrOptions?: string | HttpExceptionOptions) {
		super('ldapAlreadyPersisted', descriptionOrOptions);
	}
}
