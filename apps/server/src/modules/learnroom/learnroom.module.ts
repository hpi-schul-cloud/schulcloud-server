import { LoggerModule } from '@core/logger';
import { BoardModule } from '@modules/board';
import { ClassModule } from '@modules/class';
import { CopyHelperModule } from '@modules/copy-helper';
import { CourseModule } from '@modules/course';
import { GroupModule } from '@modules/group';
import { LessonModule } from '@modules/lesson';
import { RoleModule } from '@modules/role';
import { SchoolModule } from '@modules/school';
import { TaskModule } from '@modules/task';
import { ContextExternalToolModule } from '@modules/tool/context-external-tool';
import { UserModule } from '@modules/user';
import { DeletionModule } from '@modules/deletion';

import { forwardRef, Module } from '@nestjs/common';
import { CommonCartridgeFileValidatorPipe } from '../common-cartridge/controller/utils';
import { CommonCartridgeImportMapper } from './mapper/common-cartridge-import.mapper';
import {
	ColumnBoardNodeRepo,
	DashboardElementRepo,
	DashboardModelMapper,
	DashboardRepo,
	LegacyBoardRepo,
} from './repo';
import { DASHBOARD_REPO } from './repo/mikro-orm/dashboard.repo';
import {
	BoardCopyService,
	CommonCartridgeImportService,
	CourseCopyService,
	CourseRoomsService,
	DashboardService,
} from './service';

/**
 * @deprecated - the learnroom module is deprecated and will be removed in the future
 * it will be replaced by the new rooms module
 */
@Module({
	imports: [
		CourseModule,
		forwardRef(() => BoardModule),
		CopyHelperModule,
		ContextExternalToolModule,
		LessonModule,
		LoggerModule,
		TaskModule,
		UserModule,
		ClassModule,
		SchoolModule,
		GroupModule,
		RoleModule,
		DeletionModule,
	],
	providers: [
		{
			provide: DASHBOARD_REPO,
			useClass: DashboardRepo,
		},
		BoardCopyService,
		CommonCartridgeFileValidatorPipe,
		CommonCartridgeImportService,
		CommonCartridgeImportMapper,
		CourseCopyService,
		DashboardElementRepo,
		DashboardModelMapper,
		DashboardService,
		LegacyBoardRepo,
		CourseRoomsService,
		ColumnBoardNodeRepo,
	],
	exports: [CourseCopyService, CourseRoomsService, CommonCartridgeImportService, DashboardService],
})
export class LearnroomModule {}
