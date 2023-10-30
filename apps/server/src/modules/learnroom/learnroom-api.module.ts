import { Module } from '@nestjs/common';
import { BoardRepo } from '@shared/repo/board/board.repo';
import { CourseRepo } from '@shared/repo/course/course.repo';
import { DashboardModelMapper } from '@shared/repo/dashboard/dashboard.model.mapper';
import { DashboardRepo } from '@shared/repo/dashboard/dashboard.repo';
import { LessonRepo } from '@shared/repo/lesson/lesson.repo';
import { UserRepo } from '@shared/repo/user/user.repo';
import { AuthorizationModule } from '../authorization/authorization.module';
import { CopyHelperModule } from '../copy-helper/copy-helper.module';
import { LessonModule } from '../lesson/lesson.module';
import { CourseController } from './controller/course.controller';
import { DashboardController } from './controller/dashboard.controller';
import { RoomsController } from './controller/rooms.controller';
import { LearnroomModule } from './learnroom.module';
import { RoomBoardResponseMapper } from './mapper/room-board-response.mapper';
import { CourseCopyUC } from './uc/course-copy.uc';
import { CourseExportUc } from './uc/course-export.uc';
import { CourseUc } from './uc/course.uc';
import { DashboardUc } from './uc/dashboard.uc';
import { LessonCopyUC } from './uc/lesson-copy.uc';
import { RoomBoardDTOFactory } from './uc/room-board-dto.factory';
import { RoomsAuthorisationService } from './uc/rooms.authorisation.service';
import { RoomsUc } from './uc/rooms.uc';

@Module({
	imports: [AuthorizationModule, LessonModule, CopyHelperModule, LearnroomModule],
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
