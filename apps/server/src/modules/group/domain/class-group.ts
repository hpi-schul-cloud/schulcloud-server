import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';
import { ClassRootType, CourseInfoDto } from '../uc/dto';

export interface ClassGroupProps extends AuthorizableObject {
	id: EntityId;

	type: ClassRootType;

	name: string;

	externalSourceName?: string;

	teacherNames: string[];

	schoolYear?: string;

	isUpgradable?: boolean;

	studentCount: number;

	synchronizedCourses?: CourseInfoDto[];
}

export class ClassGroup extends DomainObject<ClassGroupProps> {}
