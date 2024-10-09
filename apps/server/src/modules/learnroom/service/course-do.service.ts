import { AuthorizationLoaderServiceGeneric } from '@modules/authorization';
import { GroupUser, type Group } from '@modules/group';
import { Inject, Injectable } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import {
	type Course,
	COURSE_REPO,
	CourseAlreadySynchronizedLoggableException,
	CourseFilter,
	CourseNotSynchronizedLoggableException,
	CourseRepo,
} from '../domain';

@Injectable()
export class CourseDoService implements AuthorizationLoaderServiceGeneric<Course> {
	constructor(@Inject(COURSE_REPO) private readonly courseRepo: CourseRepo) {}

	public async findById(courseId: EntityId): Promise<Course> {
		const courses: Course = await this.courseRepo.findCourseById(courseId);

		return courses;
	}

	public async saveAll(courses: Course[]): Promise<Course[]> {
		const savedCourses: Course[] = await this.courseRepo.saveAll(courses);

		return savedCourses;
	}

	public async findBySyncedGroup(group: Group): Promise<Course[]> {
		const courses: Course[] = await this.courseRepo.findBySyncedGroup(group);

		return courses;
	}

	public async stopSynchronization(course: Course): Promise<void> {
		if (!course.syncedWithGroup) {
			throw new CourseNotSynchronizedLoggableException(course.id);
		}

		course.syncedWithGroup = undefined;

		await this.courseRepo.save(course);
	}

	public async startSynchronization(
		course: Course,
		group: Group,
		students: GroupUser[],
		teachers: GroupUser[]
	): Promise<void> {
		if (course.syncedWithGroup) {
			throw new CourseAlreadySynchronizedLoggableException(course.id);
		}

		course.syncedWithGroup = group.id;
		course.name = group.name;
		course.startDate = group.validPeriod?.from;
		course.untilDate = group.validPeriod?.until;

		if (teachers.length >= 1) {
			course.students = students.map((groupUser: GroupUser): EntityId => groupUser.userId);
			course.teachers = teachers.map((groupUser: GroupUser): EntityId => groupUser.userId);
		} else {
			course.students = [];
		}

		await this.courseRepo.save(course);
	}

	public async getCourseInfo(filter: CourseFilter, options?: IFindOptions<Course>): Promise<Page<Course>> {
		const courses = await this.courseRepo.getCourseInfo(filter, options);

		return courses;
	}
}
