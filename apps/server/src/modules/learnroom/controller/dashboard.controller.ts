import { Controller, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { Authenticate } from '@src/modules/authentication/decorator/auth.decorator';
import { ParseObjectIdPipe } from '@shared/controller';
import { DashboardUc } from '../uc/dashboard.uc';

import { DashboardResponse, MoveElementParams, UpdateGroupParams } from './dto';
import { DashboardMapper } from '../mapper/dashboard.mapper';

@Authenticate('jwt')
@Controller('dashboard')
export class DashboardController {
	constructor(private readonly dashboardUc: DashboardUc) {}

	@Get()
	async findForUser(): Promise<DashboardResponse> {
		const dashboard = await this.dashboardUc.getUsersDashboard(/* currentUser.userId */);
		const dto = DashboardMapper.mapToResponse(dashboard);
		return dto;
	}

	@Patch(':id/moveElement')
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
	async updateGroup(
		@Param('id', ParseObjectIdPipe) dashboardId: string,
		@Query('x') x: number,
		@Query('y') y: number,
		@Body() params: UpdateGroupParams
	): Promise<DashboardResponse> {
		const dashboard = await this.dashboardUc.renameGroupOnDashboard(dashboardId, params.position, params.title);
		const dto = DashboardMapper.mapToResponse(dashboard);
		return dto;
	}
}
