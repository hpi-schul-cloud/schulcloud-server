import { Logger } from '@core/logger';
import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { CourseRepo as LegacyCourseRepo } from '@modules/course/repo';
import {
	DataDeletedEvent,
	DataDeletionDomainOperationLoggable,
	DeletionService,
	DomainDeletionReport,
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
	StatusModel,
	UserDeletedEvent,
} from '@modules/deletion';
import { Injectable } from '@nestjs/common';
import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Course as CourseEntity } from '@shared/domain/entity';
import { Counted, EntityId } from '@shared/domain/types';

@Injectable()
@EventsHandler(UserDeletedEvent)
export class CourseService implements DeletionService, IEventHandler<UserDeletedEvent> {
	constructor(
		private readonly repo: LegacyCourseRepo,
		private readonly logger: Logger,
		private readonly eventBus: EventBus,
		private readonly orm: MikroORM
	) {
		this.logger.setContext(CourseService.name);
	}

	@UseRequestContext()
	public async handle({ deletionRequestId, targetRefId }: UserDeletedEvent): Promise<void> {
		const dataDeleted = await this.deleteUserData(targetRefId);
		await this.eventBus.publish(new DataDeletedEvent(deletionRequestId, dataDeleted));
	}

	public findById(courseId: EntityId): Promise<CourseEntity> {
		const course = this.repo.findById(courseId);

		return course;
	}

	public async findAllCoursesByUserId(userId: EntityId): Promise<Counted<CourseEntity[]>> {
		const [courses, count] = await this.repo.findAllByUserId(userId);

		return [courses, count];
	}

	public async deleteUserData(userId: EntityId): Promise<DomainDeletionReport> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Deleting data from Courses',
				DomainName.COURSE,
				userId,
				StatusModel.PENDING
			)
		);
		const [courses, count] = await this.repo.findAllByUserId(userId);

		courses.forEach((course: CourseEntity) => course.removeUser(userId));

		await this.repo.save(courses);

		const result = DomainDeletionReportBuilder.build(DomainName.COURSE, [
			DomainOperationReportBuilder.build(OperationType.UPDATE, count, this.getCoursesId(courses)),
		]);

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

	public async findAllByUserId(userId: EntityId): Promise<CourseEntity[]> {
		const [courses] = await this.repo.findAllByUserId(userId);

		return courses;
	}

	public async create(course: CourseEntity): Promise<CourseEntity> {
		const result = await this.repo.createCourse(course);

		return result;
	}

	private getCoursesId(courses: CourseEntity[]): EntityId[] {
		return courses.map((course) => course.id);
	}

	public async findOneForUser(courseId: EntityId, userId: EntityId): Promise<CourseEntity> {
		const course = await this.repo.findOne(courseId, userId);

		return course;
	}
}
