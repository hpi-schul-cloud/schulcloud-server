import { Module } from '@nestjs/common';
import {
	BoardCopyService,
	CopyHelperService,
	EtherpadService,
	CourseCopyService,
	LessonCopyService,
	TaskCopyService,
} from '@shared/domain';
import {
	BoardRepo,
	CourseRepo,
	DashboardModelMapper,
	DashboardRepo,
	LessonRepo,
	TaskRepo,
	UserRepo,
} from '@shared/repo';
import { FeathersServiceProvider } from '@shared/infra/feathers';
import { Logger } from '@src/core/logger';
import { AuthorizationModule } from '../authorization';
import { CourseController } from './controller/course.controller';
import { DashboardController } from './controller/dashboard.controller';
import { RoomsController } from './controller/rooms.controller';
import { RoomBoardResponseMapper } from './mapper/room-board-response.mapper';
import { CourseCopyUC } from './uc/course-copy.uc';
import { CourseUc } from './uc/course.uc';
import { DashboardUc } from './uc/dashboard.uc';
import { LessonCopyUC } from './uc/lesson-copy.uc';
import { RoomBoardDTOFactory } from './uc/room-board-dto.factory';
import { RoomsAuthorisationService } from './uc/rooms.authorisation.service';
import { RoomsService } from './uc/rooms.service';
import { RoomsUc } from './uc/rooms.uc';

@Module({
	imports: [AuthorizationModule],
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
		BoardCopyService,
		LessonCopyService,
		LessonCopyUC,
		TaskCopyService,
		CopyHelperService,
		CourseCopyService,
		CourseCopyUC,
		RoomsService,
		EtherpadService,
		FeathersServiceProvider,
		Logger,
	],
})
export class LearnroomModule {}
