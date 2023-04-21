import { AnyBoardDo, Course, CourseGroup, Lesson, Submission, Task, Team, User } from '@shared/domain';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { SchoolDO } from '@shared/domain/domainobject/school.do';

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
	'BoardNode' = 'boardnodes',
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
	| SchoolExternalToolDO
	| AnyBoardDo;
