import { BoardModule } from '@modules/board';
import { CopyHelperModule } from '@modules/copy-helper';
import { LessonModule } from '@modules/lesson';
import { TaskModule } from '@modules/task';
import { ContextExternalToolModule } from '@modules/tool/context-external-tool';
import { ToolConfigModule } from '@modules/tool/tool-config.module';
import { Module, forwardRef } from '@nestjs/common';
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
import { CqrsModule } from '@nestjs/cqrs';
import { BoardNodeRepo } from '../board/repo';
import { COURSE_REPO } from './domain';
import { CommonCartridgeMapper } from './mapper/common-cartridge.mapper';
import { CourseMikroOrmRepo } from './repo/mikro-orm/course.repo';
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

@Module({
	imports: [
		forwardRef(() => BoardModule),
		CopyHelperModule,
		ContextExternalToolModule,
		LessonModule,
		LoggerModule,
		TaskModule,
		ToolConfigModule,
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
		CommonCartridgeMapper,
		CourseCopyService,
		CourseGroupRepo,
		CourseGroupService,
		CourseRepo,
		{
			provide: COURSE_REPO,
			useClass: CourseMikroOrmRepo,
		},
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
