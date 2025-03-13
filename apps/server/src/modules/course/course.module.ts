import { LoggerModule } from '@core/logger';
import { AuthorizationModule } from '@modules/authorization';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import {
	COURSE_REPO,
	CourseAuthorizableService,
	CourseDoService,
	CourseGroupAuthorizableService,
	CourseGroupService,
	CourseService,
	GroupDeletedHandlerService,
} from './domain';
import { CourseGroupRepo, CourseRepo } from './repo';
import { CourseMikroOrmRepo } from './repo/course-mikro-orm.repo';

@Module({
	imports: [LoggerModule, CqrsModule, AuthorizationModule],
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
		CourseGroupService,
		GroupDeletedHandlerService,
	],
	exports: [CourseService, CourseDoService],
})
export class CourseModule {}
