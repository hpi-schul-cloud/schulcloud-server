import { CourseService } from '@modules/course';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SortOrder } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { Dashboard, GridPosition, GridPositionWithGroupIndex } from '../domain/do/dashboard';
import { DASHBOARD_REPO, IDashboardRepo } from '../repo/mikro-orm/dashboard.repo';

@Injectable()
export class DashboardUc {
	constructor(
		@Inject(DASHBOARD_REPO) private readonly dashboardRepo: IDashboardRepo,
		private readonly courseService: CourseService
	) {}

	public async getUsersDashboard(userId: EntityId): Promise<Dashboard> {
		const dashboard = await this.dashboardRepo.getUsersDashboard(userId);
		const courses = await this.courseService.findAllByUserId(
			userId,
			{ onlyActiveCourses: true },
			{ order: { name: SortOrder.asc } }
		);

		dashboard.setLearnRooms(courses);
		await this.dashboardRepo.persistAndFlush(dashboard);
		return dashboard;
	}

	public async moveElementOnDashboard(
		dashboardId: EntityId,
		from: GridPositionWithGroupIndex,
		to: GridPositionWithGroupIndex,
		userId: EntityId
	): Promise<Dashboard> {
		const dashboard = await this.dashboardRepo.getDashboardById(dashboardId);
		this.validateUsersMatch(dashboard, userId);

		dashboard.moveElement(from, to);

		await this.dashboardRepo.persistAndFlush(dashboard);
		return dashboard;
	}

	public async renameGroupOnDashboard(
		dashboardId: EntityId,
		position: GridPosition,
		params: string,
		userId: EntityId
	): Promise<Dashboard> {
		const dashboard = await this.dashboardRepo.getDashboardById(dashboardId);
		this.validateUsersMatch(dashboard, userId);

		const gridElement = dashboard.getElement(position);
		gridElement.setGroupName(params);

		await this.dashboardRepo.persistAndFlush(dashboard);
		return dashboard;
	}

	private validateUsersMatch(dashboard: Dashboard, userId: EntityId): void {
		if (dashboard.getUserId() !== userId) {
			throw new NotFoundException('no such dashboard found');
		}
	}
}
