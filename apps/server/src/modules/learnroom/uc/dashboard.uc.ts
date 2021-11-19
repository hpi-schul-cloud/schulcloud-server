import { Injectable, Inject } from '@nestjs/common';
import { DashboardEntity, EntityId, GridPositionWithGroupIndex, GridPosition } from '@shared/domain';
import { IDashboardRepo } from '@shared/repo';
import { NotFound } from '@feathersjs/errors';

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
		to: GridPositionWithGroupIndex,
		userId: EntityId
	): Promise<DashboardEntity> {
		const dashboard = await this.dashboardRepo.getDashboardById(dashboardId);
		this.validateUsersMatch(dashboard, userId);

		dashboard.moveElement(from, to);

		await this.dashboardRepo.persistAndFlush(dashboard);
		return dashboard;
	}

	async renameGroupOnDashboard(
		dashboardId: EntityId,
		position: GridPosition,
		params: string,
		userId: EntityId
	): Promise<DashboardEntity> {
		const dashboard = await this.dashboardRepo.getDashboardById(dashboardId);
		this.validateUsersMatch(dashboard, userId);

		const gridElement = dashboard.getElement(position);
		gridElement.setGroupName(params);

		await this.dashboardRepo.persistAndFlush(dashboard);
		return dashboard;
	}

	private validateUsersMatch(dashboard: DashboardEntity, userId: EntityId) {
		if (dashboard.getUserId() !== userId) {
			throw new NotFound('no such dashboard found');
		}
	}
}
