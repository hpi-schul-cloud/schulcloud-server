import { Module } from '@nestjs/common';
import { FeathersServiceProvider } from '@infra/feathers';
import { LessonRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { CopyHelperModule } from '@modules/copy-helper';
import { FilesStorageClientModule } from '@modules/files-storage-client';
import { TaskModule } from '@modules/task';
import { EtherpadService, LessonCopyService, LessonService, NexboardService } from './service';

@Module({
	imports: [FilesStorageClientModule, LoggerModule, CopyHelperModule, TaskModule],
	providers: [LessonRepo, LessonService, EtherpadService, NexboardService, LessonCopyService, FeathersServiceProvider],
	exports: [LessonService, LessonCopyService],
})
export class LessonModule {}
