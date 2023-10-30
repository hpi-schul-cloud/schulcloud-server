import { Injectable } from '@nestjs/common';
import { Course } from '@shared/domain/entity/course.entity';
import { Counted } from '@shared/domain/types/counted';
import { EntityId } from '@shared/domain/types/entity-id';
import { CourseRepo } from '@shared/repo/course/course.repo';

@Injectable()
export class CourseService {
	constructor(private readonly repo: CourseRepo) {}

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
