/**
 * UserImportPermissions expect read access for current users school users.
 * They are used to read/update on @ImportUser of same school.
 */
export enum UserImportPermissions {
	SCHOOL_IMPORT_USERS_VIEW = 'IMPORT_USER_VIEW',
	SCHOOL_IMPORT_USERS_UPDATE = 'IMPORT_USER_UPDATE',
}
