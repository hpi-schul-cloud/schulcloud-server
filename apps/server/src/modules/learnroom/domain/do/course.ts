import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { CourseFeatures } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';

export interface CourseProps extends AuthorizableObject {
	name: string;

	description: string;

	schoolId: EntityId;

	studentIds: EntityId[];

	teacherIds: EntityId[];

	substitutionTeacherIds: EntityId[];

	courseGroupIds: EntityId[];

	color: string;

	startDate?: Date;

	untilDate?: Date;

	copyingSince?: Date;

	shareToken?: string;

	features: Set<CourseFeatures>;

	classIds: EntityId[];

	groupIds: EntityId[];

	syncedWithGroup?: EntityId;
}

export class Course extends DomainObject<CourseProps> {}
