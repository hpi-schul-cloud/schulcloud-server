import { RoleName } from '@shared/domain';
import { LessonCreateDto } from '@src/modules/lesson/types';
import { FederalStateNames } from '@src/modules/school/types';

export type SchoolConfig = {
	name: string;
	users: UserConfig[];
	courses?: CourseConfig[];
	federalStateName: FederalStateNames;
};

export type UserConfig = {
	roleNames: RoleName[];
	firstName: string;
	lastName: string;
	email: string;
};

export type CourseConfig = {
	name: string;
	teachers: string[];
	substitutionTeachers: string[];
	students: string[];
	lessons?: LessonConfig[];
	// teams?: TeamConfig[]; // WIP: enable feature when default-fileEntities can be persisted for teams (after merge of: https://github.com/hpi-schul-cloud/schulcloud-server/pull/4303)
};

export type LessonConfig = Omit<LessonCreateDto, 'courseId'>;

export type TeamConfig = {
	name: string;
	teamUsers: TeamUserConfig[];
};

export type TeamUserConfig = {
	userEmail: string;
	roleName: RoleName;
};

export type DemoConfiguration = {
	schools: SchoolConfig[];
};
