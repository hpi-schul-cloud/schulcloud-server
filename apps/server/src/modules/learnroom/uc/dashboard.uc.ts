import { Injectable, Inject } from '@nestjs/common';
import { DashboardEntity, EntityId, GridPositionWithGroupIndex } from '@shared/domain';
import { IDashboardRepo } from '@src/repositories/learnroom/dashboard.repo';

@Injectable()
export class DashboardUc {
	constructor(@Inject('DASHBOARD_REPO') private readonly dashboardRepo: IDashboardRepo) {}

	async getUsersDashboard(): Promise<DashboardEntity> {
		const dashboard = await this.dashboardRepo.getUsersDashboard();
		return dashboard;
	}

	async moveElementOnDashboard(
		dashboardId: EntityId,
		from: GridPositionWithGroupIndex,
		to: GridPositionWithGroupIndex
		/* currentUser: ICurrentUser */
	): Promise<DashboardEntity> {
		const dashboard = await this.dashboardRepo.getDashboardById(dashboardId);
		dashboard.moveElement(from, to);
		await this.dashboardRepo.persistAndFlush(dashboard);
		return dashboard;
	}
}
