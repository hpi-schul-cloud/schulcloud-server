import {
	AnyBoardDo,
	Course,
	CourseGroup,
	DomainObject,
	DomainObjectProps,
	EntityId,
	Lesson,
	Submission,
	Task,
	Team,
	User,
} from '@shared/domain';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
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
	| AnyBoardDo;

export interface AuthorizationLoaderService<T extends DomainObjectProps> {
	findById(id: EntityId): Promise<DomainObject<T>>;
}
