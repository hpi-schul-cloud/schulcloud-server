import { Controller, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBody } from '@nestjs/swagger';
import { Authenticate } from '@src/modules/authentication/decorator/auth.decorator';
import { ParseObjectIdPipe } from '@shared/controller';
import { DashboardUc } from '../uc/dashboard.uc';
import { DashboardResponse, MoveElementParams, PatchGroupParams } from './dto';
import { DashboardMapper } from '../mapper/dashboard.mapper';

@ApiTags('Dashboard')
@Authenticate('jwt')
@Controller('dashboard')
export class DashboardController {
	constructor(private readonly dashboardUc: DashboardUc) {}

	@Get()
	@ApiBody({ type: DashboardResponse })
	async findForUser(): Promise<DashboardResponse> {
		const dashboard = await this.dashboardUc.getUsersDashboard(/* currentUser.userId */);
		const dto = DashboardMapper.mapToResponse(dashboard);
		return dto;
	}

	@Patch(':id/moveElement')
	@ApiBody({ type: DashboardResponse })
	async moveElement(
		@Param('id', ParseObjectIdPipe) dashboardId: string,
		/* @CurrentUser() currentUser: ICurrentUser, */
		@Body() params: MoveElementParams
	): Promise<DashboardResponse> {
		const dashboard = await this.dashboardUc.moveElementOnDashboard(dashboardId, params.from, params.to);
		const dto = DashboardMapper.mapToResponse(dashboard);
		return dto;
	}

	@Patch(':id/element')
	async patchGroup(
		@Param('id', ParseObjectIdPipe) dashboardId: string,
		@Query('x') x: number,
		@Query('y') y: number,
		@Body() params: PatchGroupParams
	): Promise<DashboardResponse> {
		const dashboard = await this.dashboardUc.renameGroupOnDashboard(dashboardId, { x, y }, params.title);
		const dto = DashboardMapper.mapToResponse(dashboard);
		return dto;
	}
}
