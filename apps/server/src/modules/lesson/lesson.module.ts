import { Module } from '@nestjs/common';
import { FeathersServiceProvider } from '@shared/infra/feathers/feathers-service.provider';
import { LessonRepo } from '@shared/repo/lesson/lesson.repo';
import { LoggerModule } from '@src/core/logger/logger.module';
import { CopyHelperModule } from '../copy-helper/copy-helper.module';
import { FilesStorageClientModule } from '../files-storage-client/files-storage-client.module';
import { TaskModule } from '../task/task.module';
import { EtherpadService } from './service/etherpad.service';
import { LessonCopyService } from './service/lesson-copy.service';
import { LessonService } from './service/lesson.service';
import { NexboardService } from './service/nexboard.service';

@Module({
	imports: [FilesStorageClientModule, LoggerModule, CopyHelperModule, TaskModule],
	providers: [LessonRepo, LessonService, EtherpadService, NexboardService, LessonCopyService, FeathersServiceProvider],
	exports: [LessonService, LessonCopyService],
})
export class LessonModule {}
