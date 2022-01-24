/**
 * UserImportPermissions expect read access for current users school users.
 * They are used to read/update on @ImportUser of same school.
 */
export enum UserImportPermissions {
	VIEW_SCHOOLS_IMPORT_USERS = 'IMPORT_USER_VIEW',
	UPDATE_SCHOOLS_IMPORT_USERS = 'IMPORT_USER_UPDATE',
	STUDENT_LIST = 'STUDENT_LIST',
	TEACHER_LIST = 'TEACHER_LIST',
}
