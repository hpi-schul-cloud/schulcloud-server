import { Controller, Get, Param } from '@nestjs/common';
import { ICurrentUser } from '@shared/domain';
import { ParseObjectIdPipe } from '@shared/controller';
import { DashboardUc } from '../usecase/dashboard.uc';

import { Authenticate, CurrentUser } from '../../authentication/decorator/auth.decorator';

import { DashboardResponse } from './dto';
// import { NewsMapper } from '../mapper/news.mapper';

@Authenticate('jwt')
@Controller('dashboard')
export class DashboardController {
	constructor(private readonly dashboardUc: DashboardUc) {}

	@Get(':id')
	async findOne(
		// A parameter pipe like ParseObjectIdPipe gives us the guarantee of typesafety for @Param
		@Param('id', ParseObjectIdPipe) dashboardId: string,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<DashboardResponse> {
		// const dashboard = await this.dashboardUc.getUsersDashboard(/* dashboardId, currentUser.userId */);
		// const dto = DashboardMapper.mapToResponse(dashboard);
		return Promise.resolve(new DashboardResponse());
	}
}
