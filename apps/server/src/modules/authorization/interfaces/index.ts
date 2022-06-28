import { Course, School, Task, User } from '@shared/domain';

export enum AllowedAuthorizationEntityType {
	'User' = 'users',
	'School' = 'schools',
	'Course' = 'courses',
	'Task' = 'tasks',
}

export type AllowedEntity = Task | Course | User | School;
