import { Module } from '@nestjs/common';
import { BoardRepo, CourseRepo, DashboardModelMapper, DashboardRepo, LessonRepo, UserRepo } from '@shared/repo';
import { AuthorizationModule } from '@src/modules/authorization';
import { AuthorizationReferenceModule } from '@src/modules/authorization/authorization-reference.module';
import { CopyHelperModule } from '@src/modules/copy-helper';
import { LessonModule } from '@src/modules/lesson';
import { CourseController } from './controller/course.controller';
import { DashboardController } from './controller/dashboard.controller';
import { RoomsController } from './controller/rooms.controller';
import { LearnroomModule } from './learnroom.module';
import { RoomBoardResponseMapper } from './mapper/room-board-response.mapper';
import {
	CourseCopyUC,
	CourseExportUc,
	CourseUc,
	DashboardUc,
	LessonCopyUC,
	RoomBoardDTOFactory,
	RoomsAuthorisationService,
	RoomsUc,
} from './uc';

@Module({
	imports: [AuthorizationModule, LessonModule, CopyHelperModule, LearnroomModule, AuthorizationReferenceModule],
	controllers: [DashboardController, CourseController, RoomsController],
	providers: [
		DashboardUc,
		CourseUc,
		RoomsUc,
		RoomBoardResponseMapper,
		RoomBoardDTOFactory,
		LessonCopyUC,
		CourseCopyUC,
		RoomsAuthorisationService,
		CourseExportUc,
		// FIXME Refactor UCs to use services and remove these imports
		{
			provide: 'DASHBOARD_REPO',
			useClass: DashboardRepo,
		},
		DashboardModelMapper,
		CourseRepo,
		UserRepo,
		BoardRepo,
		LessonRepo,
	],
})
export class LearnroomApiModule {}
