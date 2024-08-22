import type { Group } from '@modules/group';
import { IFindOptions } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { BaseDomainObjectRepoInterface } from '@shared/repo/base-domain-object.repo.interface';
import { Course } from '../do';
import { CourseFilter } from './course-filter';

export interface CourseRepo extends BaseDomainObjectRepoInterface<Course> {
	findCourseById(id: EntityId): Promise<Course>;

	findBySyncedGroup(group: Group): Promise<Course[]>;

	findCourses(filter: CourseFilter, options?: IFindOptions<Course>): Promise<Course[]>;
}

export const COURSE_REPO = Symbol('COURSE_REPO');
