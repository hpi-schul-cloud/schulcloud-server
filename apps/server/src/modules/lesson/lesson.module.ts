import { Module } from '@nestjs/common';
import { FeathersServiceProvider } from '@shared/infra/feathers';
import { CourseRepo, LessonRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { CopyHelperModule } from '@src/modules/copy-helper';
import { FilesStorageClientModule } from '@src/modules/files-storage-client';
import { TaskModule } from '@src/modules/task';
import { CourseService } from '../learnroom/service/course.service';
import { EtherpadService, LessonCopyService, LessonService, NexboardService } from './service';

@Module({
	imports: [FilesStorageClientModule, LoggerModule, CopyHelperModule, TaskModule],
	controllers: [],
	providers: [
		LessonRepo,
		LessonService,
		EtherpadService,
		NexboardService,
		LessonCopyService,
		FeathersServiceProvider,
		CourseService,
		CourseRepo,
	],
	exports: [LessonService, LessonCopyService],
})
export class LessonModule {}
