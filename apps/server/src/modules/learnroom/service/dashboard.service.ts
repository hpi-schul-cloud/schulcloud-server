import { Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { IDashboardRepo, DashboardElementRepo } from '@shared/repo';
import { LegacyLogger } from '@src/core/logger';

@Injectable()
export class DashboardService {
	constructor(
		@Inject('DASHBOARD_REPO') private readonly dashboardRepo: IDashboardRepo,
		private readonly dashboardElementRepo: DashboardElementRepo,
		private readonly logger: LegacyLogger
	) {
		this.logger.setContext(DashboardService.name);
	}

	async deleteDashboardByUserId(userId: EntityId): Promise<number> {
		this.logger.log({ action: 'Deleting dasboard for userId - ', userId });
		const usersDashboard = await this.dashboardRepo.getUsersDashboard(userId);
		await this.dashboardElementRepo.deleteByDashboardId(usersDashboard.id);
		const result = await this.dashboardRepo.deleteDashboardByUserId(userId);
		this.logger.log({ action: 'Deleted dasboard for userId - ', userId });

		return result;
	}
}
