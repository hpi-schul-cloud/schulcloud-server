import { LoggerModule } from '@core/logger';
import { BoardModule } from '@modules/board';
import { ClassModule } from '@modules/class';
import { CopyHelperModule } from '@modules/copy-helper';
import { GroupModule } from '@modules/group';
import { LessonModule } from '@modules/lesson';
import { RoleModule } from '@modules/role';
import { SchoolModule } from '@modules/school';
import { TaskModule } from '@modules/task';
import { ContextExternalToolModule } from '@modules/tool/context-external-tool';
import { UserModule } from '@modules/user';
import { forwardRef, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CourseRepo } from '@shared/repo/course';
import { CourseGroupRepo } from '@shared/repo/coursegroup';
import { DashboardElementRepo, DashboardModelMapper, DashboardRepo } from '@shared/repo/dashboard';
import { LegacyBoardRepo } from '@shared/repo/legacy-board';
import { CommonCartridgeFileValidatorPipe } from '../common-cartridge/controller/utils';
import { COURSE_REPO } from './domain';
import { CommonCartridgeImportMapper } from './mapper/common-cartridge-import.mapper';
import { ColumnBoardNodeRepo } from './repo';
import { CourseMikroOrmRepo } from './repo/mikro-orm/course.repo';
import {
	BoardCopyService,
	CommonCartridgeImportService,
	CourseCopyService,
	CourseDoService,
	CourseGroupService,
	CourseRoomsService,
	CourseService,
	CourseSyncService,
	DashboardService,
	GroupDeletedHandlerService,
} from './service';

/**
 * @deprecated - the learnroom module is deprecated and will be removed in the future
 * it will be replaced by the new rooms module
 */
@Module({
	imports: [
		forwardRef(() => BoardModule),
		CopyHelperModule,
		ContextExternalToolModule,
		LessonModule,
		LoggerModule,
		TaskModule,
		CqrsModule,
		UserModule,
		ClassModule,
		SchoolModule,
		GroupModule,
		RoleModule,
	],
	providers: [
		{
			provide: 'DASHBOARD_REPO',
			useClass: DashboardRepo,
		},
		BoardCopyService,
		CommonCartridgeFileValidatorPipe,
		CommonCartridgeImportService,
		CommonCartridgeImportMapper,
		CourseCopyService,
		CourseGroupRepo,
		CourseGroupService,
		CourseRepo,
		{
			provide: COURSE_REPO,
			useClass: CourseMikroOrmRepo,
		},
		CourseService,
		CourseDoService,
		CourseSyncService,
		DashboardElementRepo,
		DashboardModelMapper,
		DashboardService,
		LegacyBoardRepo,
		CourseRoomsService,
		GroupDeletedHandlerService,
		ColumnBoardNodeRepo,
	],
	exports: [
		CourseCopyService,
		CourseService,
		CourseDoService,
		CourseSyncService,
		CourseRoomsService,
		CommonCartridgeImportService,
		CourseGroupService,
		DashboardService,
	],
})
export class LearnroomModule {}
