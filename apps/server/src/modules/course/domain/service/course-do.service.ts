import { AuthorizationLoaderServiceGeneric } from '@modules/authorization';
import { type Group } from '@modules/group';
import { Inject, Injectable } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { Course } from '../course.do';
import { COURSE_REPO, CourseFilter, CourseRepo } from '../interface';

@Injectable()
export class CourseDoService implements AuthorizationLoaderServiceGeneric<Course> {
	constructor(@Inject(COURSE_REPO) private readonly courseRepo: CourseRepo) {}

	public async findById(courseId: EntityId): Promise<Course> {
		const courses = await this.courseRepo.findCourseById(courseId);

		return courses;
	}

	public async save(course: Course): Promise<Course> {
		const savedCourse = await this.courseRepo.save(course);

		return savedCourse;
	}

	public async saveAll(courses: Course[]): Promise<Course[]> {
		const savedCourses = await this.courseRepo.saveAll(courses);

		return savedCourses;
	}

	public async findBySyncedGroup(group: Group): Promise<Course[]> {
		const courses = await this.courseRepo.findBySyncedGroup(group);

		return courses;
	}

	public async getCourseInfo(filter: CourseFilter, options?: IFindOptions<Course>): Promise<Page<Course>> {
		const courses = await this.courseRepo.getCourseInfo(filter, options);

		return courses;
	}
}
