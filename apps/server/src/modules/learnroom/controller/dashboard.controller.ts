import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DashboardMapper } from '../mapper/dashboard.mapper';
import { DashboardUc } from '../uc/dashboard.uc';
import { DashboardResponse, DashboardUrlParams, MoveElementParams, PatchGroupParams } from './dto';

@ApiTags('Dashboard')
@JwtAuthentication()
@Controller('dashboard')
export class DashboardController {
	constructor(private readonly dashboardUc: DashboardUc) {}

	@Get()
	public async findForUser(@CurrentUser() currentUser: ICurrentUser): Promise<DashboardResponse> {
		const dashboard = await this.dashboardUc.getUsersDashboard(currentUser.userId, currentUser.schoolId);
		const dto = DashboardMapper.mapToResponse(dashboard);

		return dto;
	}

	@Patch(':dashboardId/moveElement')
	public async moveElement(
		@Param() { dashboardId }: DashboardUrlParams,
		@Body() params: MoveElementParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<DashboardResponse> {
		const dashboard = await this.dashboardUc.moveElementOnDashboard(
			dashboardId,
			params.from,
			params.to,
			currentUser.userId
		);
		const dto = DashboardMapper.mapToResponse(dashboard);

		return dto;
	}

	@Patch(':dashboardId/element')
	public async patchGroup(
		@Param() urlParams: DashboardUrlParams,
		@Query('x') x: number,
		@Query('y') y: number,
		@Body() params: PatchGroupParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<DashboardResponse> {
		const dashboard = await this.dashboardUc.renameGroupOnDashboard(
			urlParams.dashboardId,
			{ x, y },
			params.title,
			currentUser.userId
		);
		const dto = DashboardMapper.mapToResponse(dashboard);

		return dto;
	}
}
