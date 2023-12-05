import { BoardModule } from '@modules/board';
import { CopyHelperModule } from '@modules/copy-helper';
import { LessonModule } from '@modules/lesson';
import { TaskModule } from '@modules/task';
import { Module } from '@nestjs/common';
import { BoardRepo, CourseRepo, DashboardModelMapper, DashboardRepo, UserRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { CommonCartridgeMapper } from './mapper/common-cartridge.mapper';
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
		BoardRepo,
		UserRepo,
		BoardCopyService,
		CourseCopyService,
		RoomsService,
		CourseService,
		CommonCartridgeExportService,
		ColumnBoardTargetService,
		CommonCartridgeMapper,
	],
	exports: [CourseCopyService, CourseService, RoomsService, CommonCartridgeExportService],
})
export class LearnroomModule {}
