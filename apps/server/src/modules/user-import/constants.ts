/**
 * UserImportPermissions expect read access for current users school users.
 * They are used to read/update on @ImportUser of same school.
 */
export enum UserImportPermissions {
	SCHOOL_IMPORT_USERS_MIGRATE = 'IMPORT_USER_MIGRATE',
	SCHOOL_IMPORT_USERS_UPDATE = 'IMPORT_USER_UPDATE',
	SCHOOL_IMPORT_USERS_VIEW = 'IMPORT_USER_VIEW',
}
