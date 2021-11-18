import { Module } from '@nestjs/common';

import { DashboardRepo, DashboardModelMapper } from '@shared/repo';

import { DashboardController } from './controller/dashboard.controller';
import { DashboardUc } from './uc/dashboard.uc';

@Module({
	imports: [],
	controllers: [DashboardController],
	providers: [
		DashboardUc,
		{
			provide: 'DASHBOARD_REPO',
			useClass: DashboardRepo,
		},
		DashboardModelMapper,
	],
})
export class LearnroomModule {}
