import { BoardModule } from '@modules/board';
import { CopyHelperModule } from '@modules/copy-helper';
import { LessonModule } from '@modules/lesson';
import { TaskModule } from '@modules/task';
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
import { CommonCartridgeMapper } from './mapper/common-cartridge.mapper';
import {
	BoardCopyService,
	ColumnBoardTargetService,
	CommonCartridgeExportService,
	CourseCopyService,
	CourseGroupService,
	CourseService,
	DashboardService,
	RoomsService,
} from './service';

@Module({
	imports: [LessonModule, TaskModule, CopyHelperModule, BoardModule, LoggerModule],
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
		ColumnBoardTargetService,
		CourseGroupService,
		CourseGroupRepo,
		DashboardService,
		CommonCartridgeMapper,
	],
	exports: [
		CourseCopyService,
		CourseService,
		RoomsService,
		CommonCartridgeExportService,
		CourseGroupService,
		DashboardService,
	],
})
export class LearnroomModule {}
