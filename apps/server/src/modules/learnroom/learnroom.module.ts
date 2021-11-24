import { Module } from '@nestjs/common';

import { DashboardRepo, DashboardModelMapper, CourseRepo } from '@shared/repo';

import { DashboardController } from './controller/dashboard.controller';
import { CourseController } from './controller/course.controller';
import { DashboardUc } from './uc/dashboard.uc';
import { CourseUc } from './uc/course.uc';

@Module({
	imports: [],
	controllers: [DashboardController, CourseController],
	providers: [
		DashboardUc,
		{
			provide: 'DASHBOARD_REPO',
			useClass: DashboardRepo,
		},
		DashboardModelMapper,
		CourseUc,
		CourseRepo,
	],
})
export class LearnroomModule {}
