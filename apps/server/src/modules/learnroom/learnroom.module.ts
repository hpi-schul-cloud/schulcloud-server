import { BoardModule } from '@modules/board';
import { CopyHelperModule } from '@modules/copy-helper';
import { LessonModule } from '@modules/lesson';
import { TaskModule } from '@modules/task';
import { Module } from '@nestjs/common';
import { BoardRepo, CourseGroupRepo, CourseRepo, DashboardModelMapper, DashboardRepo, UserRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import {
	BoardCopyService,
	ColumnBoardTargetService,
	CommonCartridgeExportService,
	CourseCopyService,
	CourseGroupService,
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
		BoardRepo,
		UserRepo,
		BoardCopyService,
		CourseCopyService,
		RoomsService,
		CourseService,
		CommonCartridgeExportService,
		ColumnBoardTargetService,
		CourseGroupService,
		CourseGroupRepo,
	],
	exports: [CourseCopyService, CourseService, RoomsService, CommonCartridgeExportService, CourseGroupService],
})
export class LearnroomModule {}
