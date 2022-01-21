import { Module } from '@nestjs/common';

import { DashboardRepo, DashboardModelMapper, CourseRepo, TaskRepo, UserRepo } from '@shared/repo';

import { DashboardController } from './controller/dashboard.controller';
import { CourseController } from './controller/course.controller';
import { DashboardUc } from './uc/dashboard.uc';
import { CourseUc } from './uc/course.uc';
import { RoomsController } from './controller/rooms.controller';
import { RoomsUc } from './uc/rooms.uc';
import { BoardMapper } from './mapper/board.mapper';

@Module({
	imports: [],
	controllers: [DashboardController, CourseController, RoomsController],
	providers: [
		DashboardUc,
		{
			provide: 'DASHBOARD_REPO',
			useClass: DashboardRepo,
		},
		DashboardModelMapper,
		CourseUc,
		CourseRepo,
		RoomsUc,
		TaskRepo,
		UserRepo,
		BoardMapper,
	],
})
export class LearnroomModule {}
