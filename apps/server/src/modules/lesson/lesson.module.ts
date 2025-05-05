import { LoggerModule } from '@core/logger';
import { FeathersServiceProvider } from '@infra/feathers';
import { AuthorizationModule } from '@modules/authorization';
import { CopyHelperModule } from '@modules/copy-helper';
import { FilesStorageClientModule } from '@modules/files-storage-client';
import { SagaModule } from '@modules/saga';
import { TaskModule } from '@modules/task';
import { Module } from '@nestjs/common';
import { EtherpadService, LessonCopyService, LessonService } from './domain';
import { LessonRepo } from './repo';
import { DeleteUserLessonDataStep } from './saga';

@Module({
	imports: [FilesStorageClientModule, LoggerModule, CopyHelperModule, TaskModule, AuthorizationModule, SagaModule],
	providers: [
		LessonRepo,
		LessonService,
		EtherpadService,
		LessonCopyService,
		FeathersServiceProvider,
		DeleteUserLessonDataStep,
	],
	exports: [LessonService, LessonCopyService],
})
export class LessonModule {}
