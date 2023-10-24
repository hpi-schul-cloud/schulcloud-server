import { Module } from '@nestjs/common';
import { FeathersServiceProvider } from '@shared/infra/feathers';
import { LessonRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { CopyHelperModule } from '@src/modules/copy-helper';
import { FilesStorageClientModule } from '@src/modules/files-storage-client';
import { TaskModule } from '@src/modules/task';
import { EtherpadService, LessonCopyService, LessonService, NexboardService } from './service';

@Module({
	imports: [FilesStorageClientModule, LoggerModule, CopyHelperModule, TaskModule],
	providers: [LessonRepo, LessonService, EtherpadService, NexboardService, LessonCopyService, FeathersServiceProvider],
	exports: [LessonService, LessonCopyService],
})
export class LessonModule {}
