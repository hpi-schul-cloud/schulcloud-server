import { Module } from '@nestjs/common';
import { CopyHelperService, EtherpadService, NexboardService, TaskCopyService } from '@shared/domain';
import { FileCopyAppendService } from '@shared/domain/service/file-copy-append.service';
import { FileLegacyService } from '@shared/domain/service/file-legacy.service';
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
import { Logger } from '@src/core/logger';
import { AuthorizationModule } from '../authorization';
import { FilesStorageClientModule } from '../files-storage-client';
import { LessonModule } from '../lesson';
import { TaskModule } from '../task';
import { CourseController } from './controller/course.controller';
import { DashboardController } from './controller/dashboard.controller';
import { RoomsController } from './controller/rooms.controller';
import { RoomBoardResponseMapper } from './mapper/room-board-response.mapper';
import { BoardCopyService } from './service/board-copy.service';
import { CourseCopyService } from './service/course-copy.service';
import { CourseEntityCopyService } from './service/course-entity-copy.service';
import { LessonCopyService } from './service/lesson-copy.service';
import { MetadataLoader } from './service/metadata-loader.service';
import { RoomsService } from './service/rooms.service';
import { CommonCartridgeExportService } from './service/common-cartridge-export.service';
import { CourseService } from './service/course.service';
import { CourseCopyUC } from './uc/course-copy.uc';
import { CourseExportUc } from './uc/course-export.uc';
import { CourseUc } from './uc/course.uc';
import { DashboardUc } from './uc/dashboard.uc';
import { LessonCopyUC } from './uc/lesson-copy.uc';
import { RoomBoardDTOFactory } from './uc/room-board-dto.factory';
import { RoomsAuthorisationService } from './uc/rooms.authorisation.service';
import { RoomsUc } from './uc/rooms.uc';

@Module({
	imports: [AuthorizationModule, FilesStorageClientModule, LessonModule, TaskModule],
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
		LessonCopyService,
		LessonCopyUC,
		TaskCopyService,
		CopyHelperService,
		CourseCopyService,
		CourseEntityCopyService,
		CourseCopyUC,
		RoomsService,
		EtherpadService,
		NexboardService,
		FileLegacyService,
		FeathersServiceProvider,
		Logger,
		FileCopyAppendService,
		MetadataLoader,
		CourseService,
		CommonCartridgeExportService,
		CourseExportUc,
	],
	exports: [CourseCopyService, MetadataLoader],
})
export class LearnroomModule {}
