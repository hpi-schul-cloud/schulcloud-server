import type { Group } from '@modules/group';
import { type Page } from '@shared/domain/domainobject';
import { type IFindOptions } from '@shared/domain/interface';
import { type EntityId } from '@shared/domain/types';
import { type BaseDomainObjectRepoInterface } from '@shared/repo/base-domain-object.repo.interface';
import { type CourseFilter } from './course-filter';
import { type Course } from '../course.do';

export interface CourseRepo extends BaseDomainObjectRepoInterface<Course> {
	findCourseById(id: EntityId): Promise<Course>;

	findBySyncedGroup(group: Group): Promise<Course[]>;

	getCourseInfo(filter: CourseFilter, options?: IFindOptions<Course>): Promise<Page<Course>>;
}

export const COURSE_REPO = Symbol('COURSE_REPO');
