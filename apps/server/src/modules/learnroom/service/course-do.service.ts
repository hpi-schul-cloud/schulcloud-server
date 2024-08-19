import { AuthorizationLoaderServiceGeneric } from '@modules/authorization';
import { type Group } from '@modules/group';
import { Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { type Course, COURSE_REPO, CourseNotSynchronizedLoggableException, CourseRepo } from '../domain';

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

	public async startSynchronization(course: Course, group: Group): Promise<void> {
		course.syncedWithGroup = group.id;

		await this.courseRepo.save(course);
	}

	public async findCoursesBySchool(schoolId: EntityId): Promise<Course[]> {
		const courses: Course[] = await this.courseRepo.findBySchoolId(schoolId);

		return courses;
	}
}
