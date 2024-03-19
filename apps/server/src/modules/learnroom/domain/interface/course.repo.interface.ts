import { Group } from '@modules/group';
import { EntityId } from '@shared/domain/types';
import { BaseDomainObjectRepoInterface } from '@shared/repo/base-domain-object.repo.interface';
import { Course } from '../do';

export interface CourseRepo extends BaseDomainObjectRepoInterface<Course> {
	findCourseById(id: EntityId): Promise<Course>;

	findBySyncedGroup(group: Group): Promise<Course[]>;
}

export const COURSE_REPO = Symbol('COURSE_REPO');
