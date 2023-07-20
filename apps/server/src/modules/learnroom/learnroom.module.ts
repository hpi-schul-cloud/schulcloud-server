import { forwardRef, Module } from '@nestjs/common';
import { BoardRepo, CourseRepo, DashboardModelMapper, DashboardRepo, LessonRepo, UserRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { BoardModule } from '@src/modules/board';
import { CopyHelperModule } from '@src/modules/copy-helper';
import { LessonModule } from '@src/modules/lesson';
import { TaskModule } from '@src/modules/task';
import { BoardCopyService, CourseCopyService } from './service';
import { ColumnBoardTargetService } from './service/column-board-target.service';
import { CommonCartridgeExportService } from './service/common-cartridge-export.service';
import { CourseService } from './service/course.service';
import { RoomsService } from './service/rooms.service';

@Module({
	imports: [LessonModule, forwardRef(() => TaskModule), CopyHelperModule, BoardModule, LoggerModule],
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
