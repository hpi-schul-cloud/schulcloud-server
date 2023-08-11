import { Module } from '@nestjs/common';
import { BoardRepo, CourseRepo, DashboardModelMapper, DashboardRepo, LessonRepo, UserRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { BoardModule } from '@src/modules/board';
import { CopyHelperModule } from '@src/modules/copy-helper';
import { LessonModule } from '@src/modules/lesson';
import { TaskModule } from '@src/modules/task';
import {
	BoardCopyService,
	ColumnBoardTargetService,
	CommonCartridgeExportService,
	CourseCopyService,
	CourseService,
	RoomsService,
} from './service';

@Module({
	imports: [LessonModule, TaskModule, CopyHelperModule, BoardModule, LoggerModule],
	providers: [
		{
			provide: 'DASHBOARD_REPO',
			useClass: DashboardRepo,
		},
		DashboardModelMapper,
		CourseRepo,
		LessonRepo,
		BoardRepo,
		UserRepo,
		BoardCopyService,
		CourseCopyService,
		RoomsService,
		CourseService,
		CommonCartridgeExportService,
		ColumnBoardTargetService,
	],
	exports: [CourseCopyService, CourseService, RoomsService, CommonCartridgeExportService],
})
export class LearnroomModule {}
