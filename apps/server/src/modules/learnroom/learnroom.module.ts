import { Module } from '@nestjs/common';

import { DashboardRepo } from '@src/repositories/learnroom/dashboard.repo';
import { DashboardModelMapper } from '@src/repositories/learnroom/dashboard.model.mapper';

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
