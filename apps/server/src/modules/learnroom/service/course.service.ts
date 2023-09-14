import { Injectable } from '@nestjs/common';
import { CourseRepo } from '@shared/repo';
import { Course, EntityId } from '@shared/domain';

@Injectable()
export class CourseService {
	constructor(private readonly repo: CourseRepo) {}

	async findById(courseId: EntityId): Promise<Course> {
		return this.repo.findById(courseId);
	}

	public async deleteUserDataFromCourse(userId: EntityId): Promise<number> {
		const [courses, count] = await this.repo.findAllByUserId(userId);

		courses.forEach((course: Course) => course.removeUser(userId));

		await this.repo.save(courses);

		return count;
	}
}
