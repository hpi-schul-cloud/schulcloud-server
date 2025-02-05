import { LoggerModule } from '@core/logger';
import { FeathersServiceProvider } from '@infra/feathers';
import { CopyHelperModule } from '@modules/copy-helper';
import { FilesStorageClientModule } from '@modules/files-storage-client';
import { TaskModule } from '@modules/task';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthorizationModule } from '../authorization';
import { LessonRepo } from './repository';
import { EtherpadService, LessonCopyService, LessonService } from './service';

@Module({
	imports: [FilesStorageClientModule, LoggerModule, CopyHelperModule, TaskModule, CqrsModule, AuthorizationModule],
	providers: [LessonRepo, LessonService, EtherpadService, LessonCopyService, FeathersServiceProvider],
	exports: [LessonService, LessonCopyService],
})
export class LessonModule {}
