import { LoggerModule } from '@core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { RoleModule } from '@modules/role';
import { SagaModule } from '@modules/saga';
import { Module } from '@nestjs/common';
import {
	COURSE_REPO,
	CourseAuthorizableService,
	CourseDoService,
	CourseGroupAuthorizableService,
	CourseGroupService,
	CourseService,
	CourseSyncService,
	// TODO: remove?
	GroupDeletedHandlerService,
} from './domain';
import { UserChangedSchoolHandlerService } from './domain/service/user-changed-school-handler.service';
import { CourseGroupRepo, CourseRepo } from './repo';
import { CourseMikroOrmRepo } from './repo/course-mikro-orm.repo';
import { DeleteUserCourseDataStep, DeleteUserCourseGroupDataStep } from './saga';

@Module({
	imports: [RoleModule, LoggerModule, AuthorizationModule, SagaModule],
	providers: [
		CourseAuthorizableService,
		CourseGroupAuthorizableService,
		CourseRepo,
		CourseGroupRepo,
		{
			provide: COURSE_REPO,
			useClass: CourseMikroOrmRepo,
		},
		CourseService,
		CourseDoService,
		CourseSyncService,
		CourseGroupService,
		// TODO: remove?
		// group event should be discussed if useful, the event does not seem to be be used anywhere else for now
		GroupDeletedHandlerService,
		UserChangedSchoolHandlerService,
		DeleteUserCourseDataStep,
		DeleteUserCourseGroupDataStep,
	],
	exports: [CourseService, CourseSyncService, CourseDoService],
})
export class CourseModule {}
