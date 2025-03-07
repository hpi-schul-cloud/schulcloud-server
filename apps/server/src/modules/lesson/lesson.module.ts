import { LoggerModule } from '@core/logger';
import { FeathersServiceProvider } from '@infra/feathers';
import { AuthorizationModule } from '@modules/authorization';
import { CopyHelperModule } from '@modules/copy-helper';
import { FilesStorageClientModule } from '@modules/files-storage-client';
import { TaskModule } from '@modules/task';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EtherpadService, LessonCopyService, LessonService } from './domain';
import { LessonRepo } from './repo';

@Module({
	imports: [FilesStorageClientModule, LoggerModule, CopyHelperModule, TaskModule, CqrsModule, AuthorizationModule],
	providers: [LessonRepo, LessonService, EtherpadService, LessonCopyService, FeathersServiceProvider],
	exports: [LessonService, LessonCopyService],
})
export class LessonModule {}
