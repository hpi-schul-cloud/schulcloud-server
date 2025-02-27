import type { Group } from '@modules/group';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { BaseDomainObjectRepoInterface } from '@shared/repo/base-domain-object.repo.interface';
import { CourseFilter } from './course-filter';
import { Course } from '../course.do';

export interface CourseRepo extends BaseDomainObjectRepoInterface<Course> {
	findCourseById(id: EntityId): Promise<Course>;

	findBySyncedGroup(group: Group): Promise<Course[]>;

	getCourseInfo(filter: CourseFilter, options?: IFindOptions<Course>): Promise<Page<Course>>;
}

export const COURSE_REPO = Symbol('COURSE_REPO');
