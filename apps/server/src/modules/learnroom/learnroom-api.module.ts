import { AuthorizationModule } from '@modules/authorization';
import { AuthorizationReferenceModule } from '@modules/authorization-reference';
import { ClassModule } from '@modules/class';
import { CopyHelperModule } from '@modules/copy-helper';
import { CourseModule } from '@modules/course';
import { GroupModule } from '@modules/group';
import { LessonModule } from '@modules/lesson';
import { RoleModule } from '@modules/role';
import { SchoolModule } from '@modules/school';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { CourseRoomsController } from './controller/course-rooms.controller';
import { CourseController } from './controller/course.controller';
import { DashboardController } from './controller/dashboard.controller';
import { LearnroomModule } from './learnroom.module';
import { RoomBoardResponseMapper } from './mapper/room-board-response.mapper';
import { DashboardModelMapper, DashboardRepo, LegacyBoardRepo } from './repo';
import { DASHBOARD_REPO } from './repo/mikro-orm/dashboard.repo';
import {
	CourseCopyUC,
	CourseImportUc,
	CourseRoomsAuthorisationService,
	CourseRoomsUc,
	DashboardUc,
	LessonCopyUC,
	RoomBoardDTOFactory,
} from './uc';

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
		CourseModule,
	],
	controllers: [DashboardController, CourseRoomsController, CourseController],
	providers: [
		DashboardUc,
		CourseRoomsUc,
		RoomBoardResponseMapper,
		RoomBoardDTOFactory,
		LessonCopyUC,
		CourseCopyUC,
		CourseRoomsAuthorisationService,
		CourseImportUc,
		// FIXME Refactor UCs to use services and remove these imports
		{
			provide: DASHBOARD_REPO,
			useClass: DashboardRepo,
		},
		DashboardModelMapper,
		LegacyBoardRepo,
	],
})
export class LearnroomApiModule {}
