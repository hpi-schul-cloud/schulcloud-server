import {
	AnyBoardDo,
	AuthorizableObject,
	Course,
	CourseGroup,
	EntityId,
	Lesson,
	Submission,
	Task,
	Team,
	User,
} from '@shared/domain';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { SchoolDO } from '@shared/domain/domainobject/school.do';

// TODO: check if interface AuthorizableObject is enough, if not then use AllowedEntity also for AuthorizationLoaderService
// AllowedAuthorizationEntityType is also related to this ~> Task.name only upper lower case are different
export type ConcretAuthorizableObjects =
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
	findById(id: EntityId): Promise<AuthorizableObject>;
}
