import { BoardModule } from '@modules/board';
import { ClassModule } from '@modules/class';
import { CopyHelperModule } from '@modules/copy-helper';
import { GroupModule } from '@modules/group';
import { LessonModule } from '@modules/lesson';
import { SchoolModule } from '@modules/school';
import { TaskModule } from '@modules/task';
import { ContextExternalToolModule } from '@modules/tool/context-external-tool';
import { UserModule } from '@modules/user';
import { forwardRef, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import {
	CourseGroupRepo,
	CourseRepo,
	DashboardElementRepo,
	DashboardModelMapper,
	DashboardRepo,
	LegacyBoardRepo,
	UserRepo,
} from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { BoardNodeRepo } from '../board/repo';
import { COURSE_REPO } from './domain';
import { CommonCartridgeExportMapper } from './mapper/common-cartridge-export.mapper';
import { CommonCartridgeImportMapper } from './mapper/common-cartridge-import.mapper';
import { ColumnBoardNodeRepo } from './repo';
import { CourseMikroOrmRepo } from './repo/mikro-orm/course.repo';
import {
	BoardCopyService,
	CommonCartridgeExportService,
	CommonCartridgeImportService,
	CourseCopyService,
	CourseDoService,
	CourseGroupService,
	CourseRoomsService,
	CourseService,
	DashboardService,
	GroupDeletedHandlerService,
} from './service';
import { CommonCartridgeFileValidatorPipe } from './utils';

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
	],
	providers: [
		{
			provide: 'DASHBOARD_REPO',
			useClass: DashboardRepo,
		},
		BoardCopyService,
		BoardNodeRepo,
		CommonCartridgeExportService,
		CommonCartridgeFileValidatorPipe,
		CommonCartridgeImportService,
		CommonCartridgeExportMapper,
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
		DashboardElementRepo,
		DashboardModelMapper,
		DashboardService,
		LegacyBoardRepo,
		CourseRoomsService,
		UserRepo,
		GroupDeletedHandlerService,
		ColumnBoardNodeRepo,
	],
	exports: [
		CourseCopyService,
		CourseService,
		CourseDoService,
		CourseRoomsService,
		CommonCartridgeExportService,
		CommonCartridgeImportService,
		CourseGroupService,
		DashboardService,
	],
})
export class LearnroomModule {}
