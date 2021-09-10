import { Controller, Get } from '@nestjs/common';
import { DashboardUc } from '../usecase/dashboard.uc';

import { Authenticate } from '../../authentication/decorator/auth.decorator';

import { DashboardResponse } from './dto';
import { DashboardMapper } from '../mapper/dashboard.mapper';
// import { NewsMapper } from '../mapper/news.mapper';

@Authenticate('jwt')
@Controller('dashboard')
export class DashboardController {
	constructor(private readonly dashboardUc: DashboardUc) {}

	@Get(':id')
	async findOne(): Promise<DashboardResponse> {
		const dashboard = await this.dashboardUc.getUsersDashboard(/* dashboardId, currentUser.userId */);
		const dto = DashboardMapper.mapToResponse(dashboard);
		return dto;
	}
}
