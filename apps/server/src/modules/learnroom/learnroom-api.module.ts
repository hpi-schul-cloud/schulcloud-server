import { AuthorizationModule } from '@modules/authorization';
import { AuthorizationReferenceModule } from '@modules/authorization/authorization-reference.module';
import { ClassModule } from '@modules/class';
import { CopyHelperModule } from '@modules/copy-helper';
import { GroupModule } from '@modules/group';

import { LessonModule } from '@modules/lesson';
import { RoleModule } from '@modules/role';
import { SchoolModule } from '@modules/school';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { CourseRepo, DashboardModelMapper, DashboardRepo, LegacyBoardRepo, UserRepo } from '@shared/repo';
import { CourseRoomsController } from './controller/course-rooms.controller';
import { CourseController } from './controller/course.controller';
import { DashboardController } from './controller/dashboard.controller';
import { LearnroomModule } from './learnroom.module';
import { RoomBoardResponseMapper } from './mapper/room-board-response.mapper';

import { CourseInfoController } from './controller/course-info.controller';
import {
	CourseCopyUC,
	CourseExportUc,
	CourseImportUc,
	CourseInfoUc,
	CourseRoomsAuthorisationService,
	CourseRoomsUc,
	CourseSyncUc,
	CourseUc,
	DashboardUc,
	LessonCopyUC,
	RoomBoardDTOFactory,
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
		SchoolModule,
		GroupModule,
		UserModule,
		ClassModule,
	],
	controllers: [DashboardController, CourseController, CourseInfoController, CourseRoomsController, RoomsController],
	providers: [
		DashboardUc,
		CourseUc,
		CourseInfoUc,
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
