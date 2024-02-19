import { Inject, Injectable } from '@nestjs/common';
import { DataDeletionDomainOperationLoggable } from '@shared/common/loggable';
import { DomainOperationBuilder } from '@shared/domain/builder';
import { DeletionService, DomainOperation } from '@shared/domain/interface';
import { DomainName, EntityId, OperationType, StatusModel } from '@shared/domain/types';
import { IDashboardRepo, DashboardElementRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';

@Injectable()
export class DashboardService implements DeletionService {
	constructor(
		@Inject('DASHBOARD_REPO') private readonly dashboardRepo: IDashboardRepo,
		private readonly dashboardElementRepo: DashboardElementRepo,
		private readonly logger: Logger
	) {
		this.logger.setContext(DashboardService.name);
	}

	async deleteUserData(userId: EntityId): Promise<DomainOperation> {
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

		const result = DomainOperationBuilder.build(DomainName.DASHBOARD, OperationType.DELETE, deletedDashboard, refs);

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
