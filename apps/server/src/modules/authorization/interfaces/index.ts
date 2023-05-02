import {
	AnyBoardDo,
	BaseDO,
	Course,
	CourseGroup,
	EntityId,
	Lesson,
	SchoolExternalToolDO,
	Submission,
	Task,
	Team,
	User,
} from '@shared/domain';
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

export interface AuthorizationLoaderService {
	findById(id: EntityId): Promise<BaseDO>;
}
