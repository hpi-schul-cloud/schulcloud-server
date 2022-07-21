import { Course, Lesson, School, Task, User, Team } from '@shared/domain';

export enum AllowedAuthorizationEntityType {
	'User' = 'users',
	'School' = 'schools',
	'Course' = 'courses',
	'Task' = 'tasks',
	'Lesson' = 'lessons',
	'Team' = 'teams',
}

export type AllowedEntity = Task | Course | User | School | Lesson | Team;
