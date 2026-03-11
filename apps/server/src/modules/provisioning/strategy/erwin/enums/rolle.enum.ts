export enum ErwinRole {
	LERN = 'LERN',
	LEHR = 'LEHR',
	LEIT = 'LEIT',
}

export enum MappedSvsRolle {
	USER = 'user',
	STUDENT = 'student',
	TEACHER = 'teacher',
	ADMIN = 'admin',
	SUPERHERO = 'superhero',
}

export type PayloadRolle = MappedSvsRolle | ErwinRole;
