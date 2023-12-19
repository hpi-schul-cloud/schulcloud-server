import { Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { IDashboardRepo, DashboardElementRepo } from '@shared/repo';

@Injectable()
export class DashboardService {
	constructor(
		@Inject('DASHBOARD_REPO') private readonly dashboardRepo: IDashboardRepo,
		private readonly dashboardElementRepo: DashboardElementRepo
	) {}

	async deleteDashboardByUserId(userId: EntityId): Promise<number> {
		const usersDashboard = await this.dashboardRepo.getUsersDashboard(userId);
		await this.dashboardElementRepo.deleteByDashboardId(usersDashboard.id);
		const result = await this.dashboardRepo.deleteDashboardByUserId(userId);

		return result;
	}
}
