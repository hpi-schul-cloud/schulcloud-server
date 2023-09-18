import { Injectable } from '@nestjs/common';
import { CourseRepo } from '@shared/repo';
import { Course, EntityId } from '@shared/domain';

@Injectable()
export class CourseService {
	constructor(private readonly repo: CourseRepo) {}

	async findById(courseId: EntityId): Promise<Course> {
		return this.repo.findById(courseId);
	}
}
