import { FeathersServiceProvider } from '@infra/feathers';
import { CopyHelperModule } from '@modules/copy-helper';
import { FilesStorageClientModule } from '@modules/files-storage-client';
import { TaskModule } from '@modules/task';
import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { LessonRepo } from './repository';
import { EtherpadService, LessonCopyService, LessonService, NexboardService } from './service';

@Module({
	imports: [FilesStorageClientModule, LoggerModule, CopyHelperModule, TaskModule],
	providers: [LessonRepo, LessonService, EtherpadService, NexboardService, LessonCopyService, FeathersServiceProvider],
	exports: [LessonService, LessonCopyService],
})
export class LessonModule {}
