export enum RoleName {
	ADMINISTRATOR = 'administrator',
	COURSEADMINISTRATOR = 'courseAdministrator',
	COURSESTUDENT = 'courseStudent',
	COURSESUBSTITUTIONTEACHER = 'courseSubstitutionTeacher',
	GROUPSUBSTITUTIONTEACHER = 'groupSubstitutionTeacher',
	COURSETEACHER = 'courseTeacher',
	DEMO = 'demo',
	DEMOSTUDENT = 'demoStudent',
	DEMOTEACHER = 'demoTeacher',
	EXPERT = 'expert',
	GUESTTEACHER = 'guestTeacher',
	GUESTSTUDENT = 'guestStudent',
	HELPDESK = 'helpdesk',
	ROOMAPPLICANT = 'roomapplicant',
	ROOMVIEWER = 'roomviewer',
	ROOMEDITOR = 'roomeditor',
	ROOMADMIN = 'roomadmin',
	ROOMOWNER = 'roomowner',
	STUDENT = 'student',
	SUPERHERO = 'superhero',
	TEACHER = 'teacher',
	TEAMADMINISTRATOR = 'teamadministrator',
	TEAMEXPERT = 'teamexpert',
	TEAMLEADER = 'teamleader',
	TEAMMEMBER = 'teammember',
	TEAMOWNER = 'teamowner',
	USER = 'user',
}
export type IUserRoleName =
	| RoleName.ADMINISTRATOR
	| RoleName.TEACHER
	| RoleName.STUDENT
	| RoleName.SUPERHERO
	| RoleName.EXPERT
	| RoleName.DEMOSTUDENT
	| RoleName.DEMOTEACHER;

export const RoomRoleArray = [
	RoleName.ROOMOWNER,
	RoleName.ROOMADMIN,
	RoleName.ROOMEDITOR,
	RoleName.ROOMVIEWER,
	RoleName.ROOMAPPLICANT,
] as const;
export type RoomRole = typeof RoomRoleArray[number];

export const GuestRoleArray = [RoleName.GUESTSTUDENT, RoleName.GUESTTEACHER] as const;
export type GuestRole = typeof GuestRoleArray[number];
