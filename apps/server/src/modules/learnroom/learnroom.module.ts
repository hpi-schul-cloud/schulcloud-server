import { Module } from '@nestjs/common';
import { BoardRepo } from '@shared/repo/board/board.repo';
import { CourseRepo } from '@shared/repo/course/course.repo';
import { DashboardModelMapper } from '@shared/repo/dashboard/dashboard.model.mapper';
import { DashboardRepo } from '@shared/repo/dashboard/dashboard.repo';
import { LessonRepo } from '@shared/repo/lesson/lesson.repo';
import { UserRepo } from '@shared/repo/user/user.repo';
import { LoggerModule } from '@src/core/logger/logger.module';
import { BoardModule } from '../board/board.module';
import { CopyHelperModule } from '../copy-helper/copy-helper.module';
import { LessonModule } from '../lesson/lesson.module';
import { TaskModule } from '../task/task.module';
import { BoardCopyService } from './service/board-copy.service';
import { ColumnBoardTargetService } from './service/column-board-target.service';
import { CommonCartridgeExportService } from './service/common-cartridge-export.service';
import { CourseCopyService } from './service/course-copy.service';
import { CourseService } from './service/course.service';
import { RoomsService } from './service/rooms.service';

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
