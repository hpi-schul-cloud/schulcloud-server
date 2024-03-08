import { BoardModule } from '@modules/board';
import { CopyHelperModule } from '@modules/copy-helper';
import { LessonModule } from '@modules/lesson';
import { TaskModule } from '@modules/task';
import { ContextExternalToolModule } from '@modules/tool/context-external-tool';
import { ToolConfigModule } from '@modules/tool/tool-config.module';
import { Module } from '@nestjs/common';
import {
	LegacyBoardRepo,
	CourseGroupRepo,
	CourseRepo,
	DashboardElementRepo,
	DashboardModelMapper,
	DashboardRepo,
	UserRepo,
} from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import {
	BoardCopyService,
	CommonCartridgeExportService,
	CommonCartridgeImportService,
	CourseCopyService,
	CourseGroupService,
	CourseService,
	DashboardService,
	RoomsService,
} from './service';
import { CommonCartridgeFileValidatorPipe } from './utils';
import { BoardNodeRepo } from '../board/repo';

@Module({
	imports: [
		LessonModule,
		TaskModule,
		CopyHelperModule,
		BoardModule,
		LoggerModule,
		ContextExternalToolModule,
		ToolConfigModule,
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
		CourseCopyService,
		CourseGroupRepo,
		CourseGroupService,
		CourseRepo,
		CourseService,
		DashboardElementRepo,
		DashboardModelMapper,
		DashboardService,
		LegacyBoardRepo,
		RoomsService,
		UserRepo,
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
