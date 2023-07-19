import { forwardRef, Module } from '@nestjs/common';
import { FeathersServiceProvider } from '@shared/infra/feathers';
import {
	BoardRepo,
	CourseRepo,
	DashboardModelMapper,
	DashboardRepo,
	LessonRepo,
	TaskRepo,
	UserRepo,
} from '@shared/repo';
import { LegacyLogger } from '@src/core/logger';
import { AuthorizationModule } from '@src/modules/authorization';
import { CopyHelperModule } from '@src/modules/copy-helper';
import { FilesStorageClientModule } from '@src/modules/files-storage-client';
import { LessonModule } from '@src/modules/lesson';
import { TaskModule } from '@src/modules/task';
import { BoardModule } from '../board';
import { CourseController } from './controller/course.controller';
import { DashboardController } from './controller/dashboard.controller';
import { RoomsController } from './controller/rooms.controller';
import { RoomBoardResponseMapper } from './mapper/room-board-response.mapper';
import { BoardCopyService, CourseCopyService, CourseService } from './service';
import { ColumnBoardTargetService } from './service/column-board-target.service';
import { CommonCartridgeExportService } from './service/common-cartridge-export.service';
import { RoomsService } from './service/rooms.service';
import { CourseCopyUC } from './uc/course-copy.uc';
import { CourseExportUc } from './uc/course-export.uc';
import { CourseUc } from './uc/course.uc';
import { DashboardUc } from './uc/dashboard.uc';
import { LessonCopyUC } from './uc/lesson-copy.uc';
import { RoomBoardDTOFactory } from './uc/room-board-dto.factory';
import { RoomsAuthorisationService } from './uc/rooms.authorisation.service';
import { RoomsUc } from './uc/rooms.uc';

@Module({
	imports: [
		forwardRef(() => AuthorizationModule),
		FilesStorageClientModule,
		LessonModule,
		TaskModule,
		TaskModule,
		CopyHelperModule,
		BoardModule,
	],
	controllers: [DashboardController, CourseController, RoomsController],
	providers: [
		DashboardUc,
		{
			provide: 'DASHBOARD_REPO',
			useClass: DashboardRepo,
		},
		DashboardModelMapper,
		CourseUc,
		CourseRepo,
		LessonRepo,
		RoomsUc,
		TaskRepo,
		UserRepo,
		BoardRepo,
		RoomBoardResponseMapper,
		RoomsAuthorisationService,
		RoomBoardDTOFactory,
		BoardCopyService,
		LessonCopyUC,
		CourseCopyService,
		CourseCopyUC,
		RoomsService,
		FeathersServiceProvider,
		LegacyLogger,
		CourseService,
		CommonCartridgeExportService,
		CourseExportUc,
		ColumnBoardTargetService,
	],
	exports: [CourseCopyService, CourseService],
})
export class LearnroomModule {}
