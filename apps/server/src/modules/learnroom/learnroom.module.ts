import { BoardModule } from '@modules/board/board.module';
import { CopyHelperModule } from '@modules/copy-helper';
import { LessonModule } from '@modules/lesson';
import { TaskModule } from '@modules/task';
import { ContextExternalToolModule } from '@modules/tool/context-external-tool';
import { ToolConfigModule } from '@modules/tool/tool-config.module';
import { Module, forwardRef } from '@nestjs/common';
import {
	BoardRepo,
	CourseGroupRepo,
	CourseRepo,
	DashboardElementRepo,
	DashboardModelMapper,
	DashboardRepo,
	UserRepo,
} from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { COURSE_REPO } from './domain';
import { CommonCartridgeMapper } from './mapper/common-cartridge.mapper';
import { CourseMikroOrmRepo } from './repo/mikro-orm/course.repo';
import {
	BoardCopyService,
	ColumnBoardTargetService,
	CommonCartridgeExportService,
	CommonCartridgeImportService,
	CourseCopyService,
	CourseGroupService,
	CourseService,
	DashboardService,
	RoomsService,
} from './service';
import { CommonCartridgeFileValidatorPipe } from './utils';

@Module({
	imports: [
		LessonModule,
		TaskModule,
		CopyHelperModule,
		forwardRef(() => BoardModule),
		LoggerModule,
		ContextExternalToolModule,
		ToolConfigModule,
	],
	providers: [
		{
			provide: 'DASHBOARD_REPO',
			useClass: DashboardRepo,
		},
		DashboardElementRepo,
		DashboardModelMapper,
		CourseRepo,
		{
			provide: COURSE_REPO,
			useClass: CourseMikroOrmRepo,
		},
		BoardRepo,
		UserRepo,
		BoardCopyService,
		CourseCopyService,
		RoomsService,
		CourseService,
		CommonCartridgeExportService,
		CommonCartridgeImportService,
		ColumnBoardTargetService,
		CourseGroupService,
		CourseGroupRepo,
		DashboardService,
		CommonCartridgeMapper,
		CommonCartridgeFileValidatorPipe,
	],
	exports: [
		CourseCopyService,
		CourseService,
		RoomsService,
		CommonCartridgeExportService,
		CommonCartridgeImportService,
		CourseGroupService,
		DashboardService,
	],
})
export class LearnroomModule {}
