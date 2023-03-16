import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { DashboardMapper } from '../mapper/dashboard.mapper';
import { DashboardUc } from '../uc/dashboard.uc';
import { DashboardResponse, DashboardUrlParams, MoveElementParams, PatchGroupParams } from './dto';

@ApiTags('Dashboard')
@Authenticate('jwt')
@Controller('dashboard')
export class DashboardController {
	constructor(private readonly dashboardUc: DashboardUc) {}

	@Get()
	async findForUser(@CurrentUser() currentUser: ICurrentUser): Promise<DashboardResponse> {
		const dashboard = await this.dashboardUc.getUsersDashboard(currentUser.userId);
		const dto = DashboardMapper.mapToResponse(dashboard);
		return dto;
	}

	@Patch(':dashboardId/moveElement')
	async moveElement(
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
	async patchGroup(
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
