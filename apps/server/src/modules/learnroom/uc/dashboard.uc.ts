import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DashboardEntity, EntityId, GridPositionWithGroupIndex, GridPosition, SortOrder } from '@shared/domain';
import { IDashboardRepo, CourseRepo } from '@shared/repo';
// import { NotFound } from '@feathersjs/errors'; // wrong import? see NotFoundException

@Injectable()
export class DashboardUc {
	constructor(
		@Inject('DASHBOARD_REPO') private readonly dashboardRepo: IDashboardRepo,
		private readonly courseRepo: CourseRepo
	) {}

	async getUsersDashboard(userId: EntityId): Promise<DashboardEntity> {
		const dashboard = await this.dashboardRepo.getUsersDashboard(userId);
		const [courses] = await this.courseRepo.findAllByUserId(
			userId,
			{ onlyActiveCourses: true },
			{ order: { name: SortOrder.asc } }
		);

		dashboard.setLearnRooms(courses);
		await this.dashboardRepo.persistAndFlush(dashboard);
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
			throw new NotFoundException('no such dashboard found');
		}
	}
}
