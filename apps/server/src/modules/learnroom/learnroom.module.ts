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

import { SagaModule } from '@modules/saga';
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
import { DeleteUserDashboardDataStep } from './saga';
import { BoardCopyService, CommonCartridgeImportService, CourseCopyService, CourseRoomsService } from './service';

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
		SagaModule,
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
		LegacyBoardRepo,
		CourseRoomsService,
		ColumnBoardNodeRepo,
		DeleteUserDashboardDataStep,
	],
	exports: [CourseCopyService, CourseRoomsService, CommonCartridgeImportService],
})
export class LearnroomModule {}
