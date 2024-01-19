import { Injectable } from '@nestjs/common';
import { DataDeletionDomainOperationLoggable } from '@shared/common/loggable';
import { Course } from '@shared/domain/entity';
import { Counted, DomainModel, EntityId, StatusModel } from '@shared/domain/types';
import { CourseRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';
import { CourseCreateDto } from '../types';

@Injectable()
export class CourseService {
	constructor(private readonly repo: CourseRepo, private readonly logger: Logger) {
		this.logger.setContext(CourseService.name);
	}

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
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Deleting data from Courses',
				DomainModel.COURSE,
				userId,
				StatusModel.PENDING
			)
		);
		const [courses, count] = await this.repo.findAllByUserId(userId);

		courses.forEach((course: Course) => course.removeUser(userId));

		await this.repo.save(courses);
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Successfully removed data from Courses',
				DomainModel.COURSE,
				userId,
				StatusModel.FINISHED,
				0,
				count
			)
		);

		return count;
	}

	async findAllByUserId(userId: EntityId): Promise<Course[]> {
		const [courses] = await this.repo.findAllByUserId(userId);

		return courses;
	}
}
