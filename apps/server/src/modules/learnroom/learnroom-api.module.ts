import { AuthorizationModule } from '@modules/authorization';
import { AuthorizationReferenceModule } from '@modules/authorization/authorization-reference.module';
import { CopyHelperModule } from '@modules/copy-helper';
import { GroupModule } from '@modules/group';
import { ClassModule } from '@modules/class';

import { LessonModule } from '@modules/lesson';
import { RoleModule } from '@modules/role';
import { SchoolModule } from '@modules/school';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { CourseRepo, DashboardModelMapper, DashboardRepo, LegacyBoardRepo, UserRepo } from '@shared/repo';
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
		UserRepo,
		LegacyBoardRepo,
	],
})
export class LearnroomApiModule {}
