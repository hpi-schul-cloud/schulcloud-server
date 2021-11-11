import { Injectable, Inject } from '@nestjs/common';
import { DashboardEntity, EntityId, GridPositionWithGroupIndex, GridPosition } from '@shared/domain';
import { IDashboardRepo } from '@shared/repo';

@Injectable()
export class DashboardUc {
	constructor(@Inject('DASHBOARD_REPO') private readonly dashboardRepo: IDashboardRepo) {}

	async getUsersDashboard(userId: EntityId): Promise<DashboardEntity> {
		const dashboard = await this.dashboardRepo.getUsersDashboard(userId);
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

	async renameGroupOnDashboard(
		dashboardId: EntityId,
		position: GridPosition,
		params: string
	): Promise<DashboardEntity> {
		const dashboard = await this.dashboardRepo.getDashboardById(dashboardId);
		const gridElement = dashboard.getElement(position);
		gridElement.setGroupName(params);
		await this.dashboardRepo.persistAndFlush(dashboard);
		return dashboard;
	}
}
