import { Inject, Injectable } from '@nestjs/common';
import { DataDeletionDomainOperationLoggable } from '@shared/common/loggable';
import { DomainModel, EntityId, StatusModel } from '@shared/domain/types';
import { IDashboardRepo, DashboardElementRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';

@Injectable()
export class DashboardService {
	constructor(
		@Inject('DASHBOARD_REPO') private readonly dashboardRepo: IDashboardRepo,
		private readonly dashboardElementRepo: DashboardElementRepo,
		private readonly logger: Logger
	) {
		this.logger.setContext(DashboardService.name);
	}

	async deleteDashboardByUserId(userId: EntityId): Promise<number> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Deleting user data from Dashboard',
				DomainModel.DASHBOARD,
				userId,
				StatusModel.PENDING
			)
		);
		const usersDashboard = await this.dashboardRepo.getUsersDashboard(userId);
		await this.dashboardElementRepo.deleteByDashboardId(usersDashboard.id);
		const result = await this.dashboardRepo.deleteDashboardByUserId(userId);
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Successfully deleted user data from Dashboard',
				DomainModel.DASHBOARD,
				userId,
				StatusModel.FINISHED,
				0,
				result
			)
		);

		return result;
	}
}
