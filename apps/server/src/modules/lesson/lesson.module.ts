import { Module } from '@nestjs/common';
import { FeathersServiceProvider } from '@shared/infra/feathers';
import { LessonRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { CopyHelperModule } from '../copy-helper';
import { FilesStorageClientModule } from '../files-storage-client';
import { TaskModule } from '../task';
import { EtherpadService, LessonCopyService, LessonService, NexboardService } from './service';

@Module({
	imports: [FilesStorageClientModule, LoggerModule, CopyHelperModule, TaskModule],
	controllers: [],
	providers: [LessonRepo, LessonService, EtherpadService, NexboardService, LessonCopyService, FeathersServiceProvider],
	exports: [LessonService, LessonCopyService],
})
export class LessonModule {}
