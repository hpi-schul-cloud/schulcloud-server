import { Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { IDashboardRepo } from '@shared/repo';
import { DashboardElementRepo } from '@shared/repo/dashboard/dashboardElement.repo';

@Injectable()
export class DashboardService {
	constructor(
		@Inject('DASHBOARD_REPO') private readonly dashboardRepo: IDashboardRepo,
		private readonly dashboardElementRepo: DashboardElementRepo
	) {}

	async deleteDashboardByUserId(userId: EntityId): Promise<number> {
		const usersDashboard = await this.dashboardRepo.getUsersDashboard(userId);
		await this.dashboardElementRepo.deleteByDasboardId(usersDashboard.id);
		const promise = await this.dashboardRepo.deleteDashboardByUserId(userId);

		return promise;
	}
}
