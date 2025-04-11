import { Logger } from '@core/logger';
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
import { IFindOptions } from '@shared/domain/interface';
import { Counted, EntityId } from '@shared/domain/types';
import { CourseEntity, CourseRepo } from '../../repo';

@Injectable()
@EventsHandler(UserDeletedEvent)
export class CourseService implements DeletionService, IEventHandler<UserDeletedEvent> {
	constructor(
		private readonly repo: CourseRepo,
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

	public async findAllCoursesByUserId(
		userId: EntityId,
		filters?: { onlyActiveCourses?: boolean },
		options?: IFindOptions<CourseEntity>
	): Promise<Counted<CourseEntity[]>> {
		const [courses, count] = await this.repo.findAllByUserId(userId, filters, options);

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
		const [courses] = await this.repo.findAllByUserId(userId);

		const count = await this.repo.removeUserReference(userId);

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

	public async findAllByUserId(
		userId: EntityId,
		filters?: { onlyActiveCourses?: boolean },
		options?: IFindOptions<CourseEntity>
	): Promise<CourseEntity[]> {
		const [courses] = await this.repo.findAllByUserId(userId, filters, options);

		return courses;
	}

	public async create(course: CourseEntity): Promise<CourseEntity> {
		const result = await this.repo.createCourse(course);

		return result;
	}

	public async save(course: CourseEntity): Promise<void> {
		await this.repo.save(course);
	}

	public async findAllForTeacherOrSubstituteTeacher(userId: EntityId): Promise<CourseEntity[]> {
		const [courses] = await this.repo.findAllForTeacherOrSubstituteTeacher(userId);

		return courses;
	}

	private getCoursesId(courses: CourseEntity[]): EntityId[] {
		return courses.map((course) => course.id);
	}

	public async findOneForUser(courseId: EntityId, userId: EntityId): Promise<CourseEntity> {
		const course = await this.repo.findOne(courseId, userId);

		return course;
	}
}
