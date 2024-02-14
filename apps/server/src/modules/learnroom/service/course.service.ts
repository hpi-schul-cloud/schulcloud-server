import { Injectable } from '@nestjs/common';
import { DataDeletionDomainOperationLoggable } from '@shared/common/loggable';
import { DomainOperationBuilder } from '@shared/domain/builder';
import { Course } from '@shared/domain/entity';
import { DomainOperation } from '@shared/domain/interface';
import { Counted, DomainName, EntityId, OperationType, StatusModel } from '@shared/domain/types';
import { CourseRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';

@Injectable()
export class CourseService {
	constructor(private readonly repo: CourseRepo, private readonly logger: Logger) {
		this.logger.setContext(CourseService.name);
	}

	async findById(courseId: EntityId): Promise<Course> {
		return this.repo.findById(courseId);
	}

	public async findAllCoursesByUserId(userId: EntityId): Promise<Counted<Course[]>> {
		const [courses, count] = await this.repo.findAllByUserId(userId);

		return [courses, count];
	}

	public async deleteUserDataFromCourse(userId: EntityId): Promise<DomainOperation> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Deleting data from Courses',
				DomainName.COURSE,
				userId,
				StatusModel.PENDING
			)
		);
		const [courses, count] = await this.repo.findAllByUserId(userId);

		courses.forEach((course: Course) => course.removeUser(userId));

		await this.repo.save(courses);

		const result = DomainOperationBuilder.build(
			DomainName.COURSE,
			OperationType.UPDATE,
			count,
			this.getCoursesId(courses)
		);

		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Successfully removed data from Courses',
				DomainName.COURSE,
				userId,
				StatusModel.FINISHED,
				0,
				count
			)
		);

		return result;
	}

	async findAllByUserId(userId: EntityId): Promise<Course[]> {
		const [courses] = await this.repo.findAllByUserId(userId);

		return courses;
	}

	private getCoursesId(courses: Course[]): EntityId[] {
		return courses.map((course) => course.id);
	}
}
