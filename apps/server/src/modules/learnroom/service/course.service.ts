import { Injectable } from '@nestjs/common';
import { Counted, Course, EntityId } from '@shared/domain';
import { CourseRepo } from '@shared/repo';
import { CourseCreateDto } from '../types';

@Injectable()
export class CourseService {
	constructor(private readonly repo: CourseRepo) {}

	async createCourse(courseCreateDto: CourseCreateDto): Promise<EntityId> {
		const course = await this.repo.createCourse(courseCreateDto);
		return course.id;
	}

	async findById(courseId: EntityId): Promise<Course> {
		return this.repo.findById(courseId);
	}

	public async findAllCoursesByUserId(userId: EntityId): Promise<Counted<Course[]>> {
		const [courses, count] = await this.repo.findAllByUserId(userId);

		return [courses, count];
	}

	public async deleteUserDataFromCourse(userId: EntityId): Promise<number> {
		const [courses, count] = await this.repo.findAllByUserId(userId);

		courses.forEach((course: Course) => course.removeUser(userId));

		await this.repo.save(courses);

		return count;
	}

	async findAllByUserId(userId: EntityId): Promise<Course[]> {
		const [courses] = await this.repo.findAllByUserId(userId);

		return courses;
	}
}
