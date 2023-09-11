export enum RoleName {
	ADMINISTRATOR = 'administrator',
	COURSEADMINISTRATOR = 'courseAdministrator',
	COURSESTUDENT = 'courseStudent',
	COURSESUBSTITUTIONTEACHER = 'courseSubstitutionTeacher',
	COURSETEACHER = 'courseTeacher',
	CYPRESSSETUP = 'cypresssetup',
	DEMO = 'demo',
	DEMOSTUDENT = 'demoStudent',
	DEMOTEACHER = 'demoTeacher',
	EXPERT = 'expert',
	HELPDESK = 'helpdesk',
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
