import {
	BaseDO,
	BoardDoAuthorizable,
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
	| BoardDoAuthorizable;

export interface AuthorizationLoaderService {
	findById(id: EntityId): Promise<BaseDO>;
}
