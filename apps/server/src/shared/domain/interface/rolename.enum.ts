export enum RoleName {
	ADMINISTRATOR = 'administrator',
	COURSEADMINISTRATOR = 'courseAdministrator',
	COURSESTUDENT = 'courseStudent',
	COURSESUBSTITUTIONTEACHER = 'courseSubstitutionTeacher',
	COURSETEACHER = 'courseTeacher',
	DEMO = 'demo',
	DEMOSTUDENT = 'demoStudent',
	DEMOTEACHER = 'demoTeacher',
	EXPERT = 'expert',
	HELPDESK = 'helpdesk',
	ROOM_VIEWER = 'room_viewer',
	ROOM_EDITOR = 'room_editor',
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

export const RoomRoleArray = [RoleName.ROOM_EDITOR, RoleName.ROOM_VIEWER] as const;
export type RoomRole = typeof RoomRoleArray[number];
