import { Course, CourseGroup, Lesson, School, Submission, Task, Team, User } from '@shared/domain';

export enum AllowedAuthorizationEntityType {
	'User' = 'users',
	'School' = 'schools',
	'Course' = 'courses',
	'CourseGroup' = 'coursegroups',
	'Task' = 'tasks',
	'Lesson' = 'lessons',
	'Team' = 'teams',
	'Submission' = 'submissions',
}

export type AllowedEntity = Task | Course | CourseGroup | User | School | Lesson | Team | Submission;
