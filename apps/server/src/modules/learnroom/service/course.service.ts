import { Injectable } from '@nestjs/common';
import { Course, EntityId } from '@shared/domain';
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
}
