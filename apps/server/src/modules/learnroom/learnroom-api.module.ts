import { AuthorizationModule } from '@modules/authorization';
import { AuthorizationReferenceModule } from '@modules/authorization/authorization-reference.module';
import { CopyHelperModule } from '@modules/copy-helper';
import { LessonModule } from '@modules/lesson';
import { RoleModule } from '@modules/role';
import { Module } from '@nestjs/common';
import { CourseRepo, DashboardModelMapper, DashboardRepo, LegacyBoardRepo, UserRepo } from '@shared/repo';
import { CourseController } from './controller/course.controller';
import { DashboardController } from './controller/dashboard.controller';
import { CourseRoomsController } from './controller/course-rooms.controller';
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
	CourseRoomsAuthorisationService,
	CourseRoomsUc,
} from './uc';
import { RoomsController } from './controller/rooms.controller';

/**
 * @deprecated - the learnroom module is deprecated and will be removed in the future
 * it will be replaced by the new rooms module
 */
@Module({
	imports: [
		AuthorizationModule,
		LessonModule,
		CopyHelperModule,
		LearnroomModule,
		AuthorizationReferenceModule,
		RoleModule,
	],
	controllers: [DashboardController, CourseController, CourseRoomsController, RoomsController],
	providers: [
		DashboardUc,
		CourseUc,
		CourseRoomsUc,
		RoomBoardResponseMapper,
		RoomBoardDTOFactory,
		LessonCopyUC,
		CourseCopyUC,
		CourseRoomsAuthorisationService,
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
		UserRepo,
		LegacyBoardRepo,
	],
})
export class LearnroomApiModule {}
