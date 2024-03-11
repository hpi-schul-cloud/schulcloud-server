import { Injectable } from '@nestjs/common';
import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { DataDeletionDomainOperationLoggable } from '@shared/common/loggable';
import { DomainDeletionReportBuilder, DomainOperationReportBuilder } from '@shared/domain/builder';
import { Course } from '@shared/domain/entity';
import { DeletionService, DomainDeletionReport } from '@shared/domain/interface';
import { Counted, DomainName, EntityId, OperationType, StatusModel } from '@shared/domain/types';
import { CourseRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';
import { DataDeletedEvent, UserDeletedEvent } from '@modules/deletion';

@Injectable()
@EventsHandler(UserDeletedEvent)
export class CourseService implements DeletionService, IEventHandler<UserDeletedEvent> {
	constructor(private readonly repo: CourseRepo, private readonly logger: Logger, private readonly eventBus: EventBus) {
		this.logger.setContext(CourseService.name);
	}

	public async handle({ deletionRequestId, targetRefId }: UserDeletedEvent): Promise<void> {
		const dataDeleted = await this.deleteUserData(targetRefId);
		await this.eventBus.publish(new DataDeletedEvent(deletionRequestId, dataDeleted));
	}

	async findById(courseId: EntityId): Promise<Course> {
		return this.repo.findById(courseId);
	}

	public async findAllCoursesByUserId(userId: EntityId): Promise<Counted<Course[]>> {
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

		courses.forEach((course: Course) => course.removeUser(userId));

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

	async findAllByUserId(userId: EntityId): Promise<Course[]> {
		const [courses] = await this.repo.findAllByUserId(userId);

		return courses;
	}

	async create(course: Course): Promise<void> {
		await this.repo.createCourse(course);
	}

	private getCoursesId(courses: Course[]): EntityId[] {
		return courses.map((course) => course.id);
	}

	async findOneForUser(courseId: EntityId, userId: EntityId): Promise<Course> {
		const course = await this.repo.findOne(courseId, userId);
		return course;
	}
}
