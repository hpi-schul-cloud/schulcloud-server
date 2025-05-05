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
		GroupDeletedHandlerService,
		DeleteUserCourseDataStep,
		DeleteUserCourseGroupDataStep,
	],
	exports: [CourseService, CourseSyncService, CourseDoService],
})
export class CourseModule {}
