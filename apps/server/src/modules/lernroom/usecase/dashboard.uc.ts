import { Injectable, Inject } from '@nestjs/common';
import { DashboardEntity } from '@src/entities/learnroom/dashboard.entity';
import { IDashboardRepo } from '@src/repositories/learnroom/dashboard.repo';

@Injectable()
export class DashboardUc {
	constructor(@Inject('DASHBOARD_REPO') private dashboardRepo: IDashboardRepo) {}

	async getUsersDashboard(): Promise<DashboardEntity> {
		const dashboard = await this.dashboardRepo.getUsersDashboard();
		return dashboard;
	}
}
