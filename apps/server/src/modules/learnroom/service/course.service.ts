import { MikroORM, UseRequestContext } from '@mikro-orm/core';
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
import { CourseRepo as LegacyCourseRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';

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

	async findById(courseId: EntityId): Promise<CourseEntity> {
		return this.repo.findById(courseId);
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

	async findAllByUserId(userId: EntityId): Promise<CourseEntity[]> {
		const [courses] = await this.repo.findAllByUserId(userId);

		return courses;
	}

	async create(course: CourseEntity): Promise<void> {
		await this.repo.createCourse(course);
	}

	private getCoursesId(courses: CourseEntity[]): EntityId[] {
		return courses.map((course) => course.id);
	}

	async findOneForUser(courseId: EntityId, userId: EntityId): Promise<CourseEntity> {
		const course = await this.repo.findOne(courseId, userId);
		return course;
	}

	public async findCoursesBySchool(schoolId: EntityId): Promise<CourseEntity[]> {
		const courses = await this.repo.findCoursesBySchoolId(schoolId);

		return courses;
	}
}
