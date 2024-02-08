import { BoardModule } from '@modules/board';
import { CopyHelperModule } from '@modules/copy-helper';
import { LessonModule } from '@modules/lesson';
import { TaskModule } from '@modules/task';
import { ContextExternalToolModule } from '@modules/tool/context-external-tool';
import { Module } from '@nestjs/common';
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
import { ToolConfigModule } from '../tool/tool-config.module';
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
import { LearnroomConfigService } from './service/learnroom-config.service';
import { CommonCartridgeFileValidatorPipe } from './utils';

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
		DashboardElementRepo,
		DashboardModelMapper,
		CourseRepo,
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
		LearnroomConfigService,
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
		LearnroomConfigService,
	],
})
export class LearnroomModule {}
