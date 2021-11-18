import { Controller, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBody } from '@nestjs/swagger';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ParseObjectIdPipe } from '@shared/controller';
import { ICurrentUser } from '@shared/domain';
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
	async findForUser(@CurrentUser() currentUser: ICurrentUser): Promise<DashboardResponse> {
		const dashboard = await this.dashboardUc.getUsersDashboard(currentUser.userId);
		const dto = DashboardMapper.mapToResponse(dashboard);
		return dto;
	}

	@Patch(':id/moveElement')
	@ApiBody({ type: DashboardResponse })
	async moveElement(
		@Param('id', ParseObjectIdPipe) dashboardId: string,
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

	@Patch(':id/element')
	async patchGroup(
		@Param('id', ParseObjectIdPipe) dashboardId: string,
		@Query('x') x: number,
		@Query('y') y: number,
		@Body() params: PatchGroupParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<DashboardResponse> {
		const dashboard = await this.dashboardUc.renameGroupOnDashboard(
			dashboardId,
			{ x, y },
			params.title,
			currentUser.userId
		);
		const dto = DashboardMapper.mapToResponse(dashboard);
		return dto;
	}
}
