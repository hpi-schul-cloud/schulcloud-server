import { LoggerModule } from '@core/logger';
import { RoleModule } from '@modules/role';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { COURSE_REPO, CourseDoService, CourseService, CourseSyncService } from './domain';
import { CourseRepo } from './repo';
import { CourseMikroOrmRepo } from './repo/course-mikro-orm.repo';

@Module({
	imports: [RoleModule, LoggerModule, CqrsModule],
	providers: [
		CourseService,
		CourseRepo,
		CourseSyncService,
		{
			provide: COURSE_REPO,
			useClass: CourseMikroOrmRepo,
		},
		CourseService,
		CourseDoService,
		CourseSyncService,
	],
	exports: [CourseService, CourseSyncService, CourseDoService],
})
export class CourseModule {}
