import { Injectable } from '@nestjs/common';
import { Course, EntityId } from '@shared/domain';
import { CourseRepo } from '@shared/repo';

@Injectable()
export class CourseService {
	constructor(private readonly repo: CourseRepo) {}

	async findById(courseId: EntityId): Promise<Course> {
		return this.repo.findById(courseId);
	}

	async findAllByUserId(userId: EntityId): Promise<Course[]> {
		const [courses] = await this.repo.findAllByUserId(userId);

		return courses;
	}
}
