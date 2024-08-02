import { BoardModule } from '@modules/board';
import { CopyHelperModule } from '@modules/copy-helper';
import { LessonModule } from '@modules/lesson';
import { TaskModule } from '@modules/task';
import { ContextExternalToolModule } from '@modules/tool/context-external-tool';
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
	CourseService,
	DashboardService,
	GroupDeletedHandlerService,
	RoomsService,
} from './service';
import { CommonCartridgeFileValidatorPipe } from './utils';
import { GroupService } from '../group';
import { GroupRepo } from '../group/repo';

@Module({
	imports: [
		forwardRef(() => BoardModule),
		CopyHelperModule,
		ContextExternalToolModule,
		LessonModule,
		LoggerModule,
		TaskModule,
		CqrsModule,
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
		GroupRepo,
		GroupService,
		DashboardElementRepo,
		DashboardModelMapper,
		DashboardService,
		LegacyBoardRepo,
		RoomsService,
		UserRepo,
		GroupDeletedHandlerService,
		ColumnBoardNodeRepo,
	],
	exports: [
		CourseCopyService,
		CourseService,
		CourseDoService,
		GroupService,
		RoomsService,
		CommonCartridgeExportService,
		CommonCartridgeImportService,
		CourseGroupService,
		DashboardService,
	],
})
export class LearnroomModule {}
