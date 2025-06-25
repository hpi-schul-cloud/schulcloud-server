import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';
import { Course } from '../../course';
import { ClassRootType } from '../uc/dto';

export interface ClassGroupProps extends AuthorizableObject {
	id: EntityId;

	type: ClassRootType;

	name: string;

	externalSourceName?: string;

	teacherNames: string[];

	schoolYear?: string;

	isUpgradable?: boolean;

	studentCount: number;

	synchronizedCourses?: Course[];
}

export class ClassGroup extends DomainObject<ClassGroupProps> {}
