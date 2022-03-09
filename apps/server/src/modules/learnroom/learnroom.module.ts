import { Module } from '@nestjs/common';

import {
	DashboardRepo,
	DashboardModelMapper,
	CourseRepo,
	LessonRepo,
	TaskRepo,
	UserRepo,
	BoardRepo,
} from '@shared/repo';

import { DashboardController } from './controller/dashboard.controller';
import { CourseController } from './controller/course.controller';
import { DashboardUc } from './uc/dashboard.uc';
import { CourseUc } from './uc/course.uc';
import { RoomsController } from './controller/rooms.controller';
import { RoomsUc } from './uc/rooms.uc';
import { RoomBoardResponseMapper } from './mapper/room-board-response.mapper';
import { RoomsAuthorisationService } from './uc/rooms.authorisation.service';
import { RoomBoardDTOFactory } from './uc/room-board-dto.factory';

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
		LessonRepo,
		RoomsUc,
		TaskRepo,
		UserRepo,
		BoardRepo,
		RoomBoardResponseMapper,
		RoomsAuthorisationService,
		RoomBoardDTOFactory,
	],
})
export class LearnroomModule {}
