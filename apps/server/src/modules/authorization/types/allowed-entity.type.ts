import { Course, CourseGroup, Lesson, Submission, Task, Team, User } from '@shared/domain';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';

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
