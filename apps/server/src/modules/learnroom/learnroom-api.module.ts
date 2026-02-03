import { RegisterTimeoutConfig } from '@core/interceptor/register-timeout-config.decorator';
import { ConfigurationModule } from '@infra/configuration';
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
import { DashboardController } from './controller/dashboard.controller';
import { LEARNROOM_CONFIG_TOKEN, LearnroomConfig } from './learnroom.config';
import { LearnroomModule } from './learnroom.module';
import { RoomBoardResponseMapper } from './mapper/room-board-response.mapper';
import { DashboardModelMapper, DashboardRepo, LegacyBoardRepo } from './repo';
import { DASHBOARD_REPO } from './repo/mikro-orm/dashboard.repo';
import { LEARNROOM_TIMEOUT_CONFIG_TOKEN, LearnroomTimeoutConfig } from './timeout.config';
import {
	CourseCopyUC,
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
		ConfigurationModule.register(LEARNROOM_CONFIG_TOKEN, LearnroomConfig),
		ConfigurationModule.register(LEARNROOM_TIMEOUT_CONFIG_TOKEN, LearnroomTimeoutConfig),
	],
	controllers: [DashboardController, CourseRoomsController],
	providers: [
		DashboardUc,
		CourseRoomsUc,
		RoomBoardResponseMapper,
		RoomBoardDTOFactory,
		LessonCopyUC,
		CourseCopyUC,
		CourseRoomsAuthorisationService,
		// FIXME Refactor UCs to use services and remove these imports
		{
			provide: DASHBOARD_REPO,
			useClass: DashboardRepo,
		},
		DashboardModelMapper,
		LegacyBoardRepo,
	],
})
@RegisterTimeoutConfig(LEARNROOM_TIMEOUT_CONFIG_TOKEN)
export class LearnroomApiModule {}
