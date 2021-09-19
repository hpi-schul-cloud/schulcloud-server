import { Injectable, Inject } from '@nestjs/common';
import { DashboardEntity } from '@shared/domain';
import { IDashboardRepo } from '@src/repositories/learnroom/dashboard.repo';

@Injectable()
export class DashboardUc {
	constructor(@Inject('DASHBOARD_REPO') private readonly dashboardRepo: IDashboardRepo) {}

	async getUsersDashboard(): Promise<DashboardEntity> {
		const dashboard = await this.dashboardRepo.getUsersDashboard();
		return dashboard;
	}
}
