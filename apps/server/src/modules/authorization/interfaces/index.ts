import { Course, Lesson, School, Task, User } from '@shared/domain';

export enum AllowedAuthorizationEntityType {
	'User' = 'users',
	'School' = 'schools',
	'Course' = 'courses',
	'Task' = 'tasks',
	'Lesson' = 'lessons',
}

export type AllowedEntity = Task | Course | User | School | Lesson;
