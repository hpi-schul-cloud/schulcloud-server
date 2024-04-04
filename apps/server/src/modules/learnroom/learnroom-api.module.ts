import { AuthorizationModule } from '@modules/authorization';
import { AuthorizationReferenceModule } from '@modules/authorization/authorization-reference.module';
import { CopyHelperModule } from '@modules/copy-helper';
import { LessonModule } from '@modules/lesson';
import { Module } from '@nestjs/common';
import { CourseRepo, DashboardModelMapper, DashboardRepo, LegacyBoardRepo, RoleRepo, UserRepo } from '@shared/repo';
import { CourseController } from './controller/course.controller';
import { DashboardController } from './controller/dashboard.controller';
import { RoomsController } from './controller/rooms.controller';
import { LearnroomModule } from './learnroom.module';
import { RoomBoardResponseMapper } from './mapper/room-board-response.mapper';
import {
	CourseCopyUC,
	CourseExportUc,
	CourseImportUc,
	CourseSyncUc,
	CourseUc,
	DashboardUc,
	LessonCopyUC,
	RoomBoardDTOFactory,
	RoomsAuthorisationService,
	RoomsUc,
} from './uc';
import { RoleService } from '../role';

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
		CourseImportUc,
		CourseSyncUc,
		// FIXME Refactor UCs to use services and remove these imports
		{
			provide: 'DASHBOARD_REPO',
			useClass: DashboardRepo,
		},
		DashboardModelMapper,
		CourseRepo,
		RoleRepo,
		RoleService,
		UserRepo,
		LegacyBoardRepo,
	],
})
export class LearnroomApiModule {}
