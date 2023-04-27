import { Course, CourseGroup, Lesson, Submission, Task, Team, User } from '@shared/domain';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/tool/school-external-tool.do';

export enum AllowedAuthorizationEntityType {
	'User' = 'users',
	'School' = 'schools',
	'Course' = 'courses',
	'CourseGroup' = 'coursegroups',
	'Task' = 'tasks',
	'Lesson' = 'lessons',
	'Team' = 'teams',
	'Submission' = 'submissions',
	'SchoolExternalTool' = 'school_external_tools',
}

export type AllowedEntity =
	| Task
	| Course
	| CourseGroup
	| User
	| SchoolDO
	| Lesson
	| Team
	| Submission
	| SchoolExternalToolDO;
