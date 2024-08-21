import { AuthorizationLoaderServiceGeneric } from '@modules/authorization';
import { type Group } from '@modules/group';
import { Inject, Injectable } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject/page';
import { IFindOptions } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { type Course as CourseDO, COURSE_REPO, CourseNotSynchronizedLoggableException, CourseRepo } from '../domain';
import { CourseAlreadySynchronizedLoggableException } from '../domain/error/course-already-synchronized.loggable-exception';
import { CourseFilter } from '../domain/interface/course-filter';

@Injectable()
export class CourseDoService implements AuthorizationLoaderServiceGeneric<CourseDO> {
	constructor(@Inject(COURSE_REPO) private readonly courseRepo: CourseRepo) {}

	public async findById(courseId: EntityId): Promise<CourseDO> {
		const courses: CourseDO = await this.courseRepo.findCourseById(courseId);

		return courses;
	}

	public async saveAll(courses: CourseDO[]): Promise<CourseDO[]> {
		const savedCourses: CourseDO[] = await this.courseRepo.saveAll(courses);

		return savedCourses;
	}

	public async findBySyncedGroup(group: Group): Promise<CourseDO[]> {
		const courses: CourseDO[] = await this.courseRepo.findBySyncedGroup(group);

		return courses;
	}

	public async stopSynchronization(course: CourseDO): Promise<void> {
		if (!course.syncedWithGroup) {
			throw new CourseNotSynchronizedLoggableException(course.id);
		}

		course.syncedWithGroup = undefined;

		await this.courseRepo.save(course);
	}

	public async startSynchronization(course: CourseDO, group: Group): Promise<void> {
		if (course.syncedWithGroup) {
			throw new CourseAlreadySynchronizedLoggableException(course.id);
		}

		course.syncedWithGroup = group.id;

		await this.courseRepo.save(course);
	}

	public async findCourses(filter: CourseFilter, options?: IFindOptions<CourseDO>): Promise<Page<CourseDO>> {
		const courses = await this.courseRepo.findCourses(filter, options);

		return courses;
	}
}
