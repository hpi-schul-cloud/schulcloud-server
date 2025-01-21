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
import { CourseGroup } from '@shared/domain/entity';
import { Counted, EntityId } from '@shared/domain/types';
import { CourseGroupRepo } from '@shared/repo';
import { Logger } from '@core/logger';

@Injectable()
@EventsHandler(UserDeletedEvent)
export class CourseGroupService implements DeletionService, IEventHandler<UserDeletedEvent> {
	constructor(
		private readonly repo: CourseGroupRepo,
		private readonly logger: Logger,
		private readonly eventBus: EventBus,
		private readonly orm: MikroORM
	) {
		this.logger.setContext(CourseGroupService.name);
	}

	@UseRequestContext()
	public async handle({ deletionRequestId, targetRefId }: UserDeletedEvent): Promise<void> {
		const dataDeleted = await this.deleteUserData(targetRefId);
		await this.eventBus.publish(new DataDeletedEvent(deletionRequestId, dataDeleted));
	}

	public async findAllCourseGroupsByUserId(userId: EntityId): Promise<Counted<CourseGroup[]>> {
		const [courseGroups, count] = await this.repo.findByUserId(userId);

		return [courseGroups, count];
	}

	public async deleteUserData(userId: EntityId): Promise<DomainDeletionReport> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Deleting user data from CourseGroup',
				DomainName.COURSEGROUP,
				userId,
				StatusModel.PENDING
			)
		);
		const [courseGroups, count] = await this.repo.findByUserId(userId);

		courseGroups.forEach((courseGroup) => courseGroup.removeStudent(userId));

		await this.repo.save(courseGroups);

		const result = DomainDeletionReportBuilder.build(DomainName.COURSEGROUP, [
			DomainOperationReportBuilder.build(OperationType.UPDATE, count, this.getCourseGroupsId(courseGroups)),
		]);

		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Successfully deleted user data from CourseGroup',
				DomainName.COURSEGROUP,
				userId,
				StatusModel.FINISHED,
				count,
				0
			)
		);

		return result;
	}

	private getCourseGroupsId(courseGroups: CourseGroup[]): EntityId[] {
		return courseGroups.map((courseGroup) => courseGroup.id);
	}
}
