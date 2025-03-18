import { LoggerModule } from '@core/logger';
import { FeathersServiceProvider } from '@infra/feathers';
import { AuthorizationModule } from '@modules/authorization';
import { CopyHelperModule } from '@modules/copy-helper';
import { FilesStorageClientModule } from '@modules/files-storage-client';
import { TaskModule } from '@modules/task';
import { Module } from '@nestjs/common';
import { EtherpadService, LessonCopyService, LessonService } from './domain';
import { LessonRepo } from './repo';
import { DeletionModule } from '@modules/deletion';

@Module({
	imports: [FilesStorageClientModule, LoggerModule, CopyHelperModule, TaskModule, AuthorizationModule, DeletionModule],
	providers: [LessonRepo, LessonService, EtherpadService, LessonCopyService, FeathersServiceProvider],
	exports: [LessonService, LessonCopyService],
})
export class LessonModule {}
