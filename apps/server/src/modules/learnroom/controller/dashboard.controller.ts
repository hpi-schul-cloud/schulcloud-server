import { Controller, Get } from '@nestjs/common';
import { DashboardUc } from '../uc/dashboard.uc';

import { Authenticate } from '../../authentication/decorator/auth.decorator';

import { DashboardResponse } from './dto';
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
}
