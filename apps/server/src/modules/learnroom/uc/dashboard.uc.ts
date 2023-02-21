import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { AuthorisationUtils } from '@shared/domain/rules/authorisation.utils';
import {
	DashboardEntity,
	EntityId,
	GridPositionWithGroupIndex,
	GridPosition,
	SortOrder,
	RoleName,
	Course,
} from '@shared/domain';
import { IDashboardRepo, CourseRepo, UserRepo } from '@shared/repo';
// import { NotFound } from '@feathersjs/errors'; // wrong import? see NotFoundException

@Injectable()
export class DashboardUc {
	constructor(
		@Inject('DASHBOARD_REPO') private readonly dashboardRepo: IDashboardRepo,
		private readonly courseRepo: CourseRepo,
		private readonly authorisationUtils: AuthorisationUtils,
		private readonly userRepo: UserRepo
	) {}

	async getUsersDashboard(userId: EntityId, showSubstitute?: boolean): Promise<DashboardEntity> {
		let courses: Course[];
		const dashboard = await this.dashboardRepo.getUsersDashboard(userId);
		const user = await this.userRepo.findById(userId, true);

		if (this.authorisationUtils.hasRole(user, RoleName.TEACHER) && !showSubstitute) {
			[courses] = await this.courseRepo.findAllForTeacher(
				userId,
				{ onlyActiveCourses: true },
				{ order: { name: SortOrder.asc } }
			);
		} else {
			[courses] = await this.courseRepo.findAllByUserId(
				userId,
				{ onlyActiveCourses: true },
				{ order: { name: SortOrder.asc } }
			);
		}

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

		const [substituteCourses] = await this.courseRepo.findAllForSubstituteTeacher(userId); // TODO in the future this will be removed because it is used as a temporory solution just to stop arrrnagement and grouping of substitute courses
		dashboard.moveElement(from, to, substituteCourses);

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
