import { LoggerModule } from '@core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { RoleModule } from '@modules/role';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import {
	COURSE_REPO,
	CourseAuthorizableService,
	CourseDoService,
	CourseGroupAuthorizableService,
	CourseGroupService,
	CourseService,
	CourseSyncService,
	GroupDeletedHandlerService,
} from './domain';
import { CourseGroupRepo, CourseRepo } from './repo';
import { CourseMikroOrmRepo } from './repo/course-mikro-orm.repo';

@Module({
	imports: [RoleModule, LoggerModule, CqrsModule, AuthorizationModule],
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
		GroupDeletedHandlerService,
	],
	exports: [CourseService, CourseSyncService, CourseDoService],
})
export class CourseModule {}
