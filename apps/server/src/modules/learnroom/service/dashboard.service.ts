import { Inject, Injectable } from '@nestjs/common';
import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { EntityId, StatusModel } from '@shared/domain/types';
import { IDashboardRepo, DashboardElementRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';
import {
	UserDeletedEvent,
	DeletionService,
	DataDeletedEvent,
	DomainDeletionReport,
	DataDeletionDomainOperationLoggable,
	DomainName,
	DomainDeletionReportBuilder,
	DomainOperationReportBuilder,
	OperationType,
} from '@modules/deletion';

@Injectable()
@EventsHandler(UserDeletedEvent)
export class DashboardService implements DeletionService, IEventHandler<UserDeletedEvent> {
	constructor(
		@Inject('DASHBOARD_REPO') private readonly dashboardRepo: IDashboardRepo,
		private readonly dashboardElementRepo: DashboardElementRepo,
		private readonly logger: Logger,
		private readonly eventBus: EventBus
	) {
		this.logger.setContext(DashboardService.name);
	}

	public async handle({ deletionRequestId, targetRefId }: UserDeletedEvent): Promise<void> {
		const dataDeleted = await this.deleteUserData(targetRefId);
		await this.eventBus.publish(new DataDeletedEvent(deletionRequestId, dataDeleted));
	}

	public async deleteUserData(userId: EntityId): Promise<DomainDeletionReport> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Deleting user data from Dashboard',
				DomainName.DASHBOARD,
				userId,
				StatusModel.PENDING
			)
		);
		let deletedDashboard = 0;
		const refs: string[] = [];
		const usersDashboard = await this.dashboardRepo.getUsersDashboardIfExist(userId);
		if (usersDashboard !== null) {
			await this.dashboardElementRepo.deleteByDashboardId(usersDashboard.id);
			deletedDashboard = await this.dashboardRepo.deleteDashboardByUserId(userId);
			refs.push(usersDashboard.id);
		}

		const result = DomainDeletionReportBuilder.build(DomainName.DASHBOARD, [
			DomainOperationReportBuilder.build(OperationType.DELETE, deletedDashboard, refs),
		]);

		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Successfully deleted user data from Dashboard',
				DomainName.DASHBOARD,
				userId,
				StatusModel.FINISHED,
				0,
				deletedDashboard
			)
		);

		return result;
	}
}
