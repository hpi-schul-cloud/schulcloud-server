import { Module } from '@nestjs/common';

import { DashboardRepo } from '@src/repositories/learnroom/dashboard.repo';

import { DashboardController } from './controller/dashboard.controller';
import { DashboardUc } from './usecase/dashboard.uc';

@Module({
	imports: [],
	controllers: [DashboardController],
	providers: [
		DashboardUc,
		{
			provide: 'DASHBOARD_REPO',
			useClass: DashboardRepo,
		},
	],
})
export class LearnroomModule {}
