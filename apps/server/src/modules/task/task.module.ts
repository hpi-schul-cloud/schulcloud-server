import { Module } from '@nestjs/common';
import { CopyHelperService } from '@shared/domain';
import { FileCopyAppendService } from '@shared/domain/service/file-copy-append.service';
import { FileLegacyService } from '@shared/domain/service/file-legacy.service';
import { TaskCopyService } from '@shared/domain/service/task-copy.service';
import { FeathersServiceProvider } from '@shared/infra/feathers';
import { CourseRepo, LessonRepo, TaskRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';
import { AuthorizationModule } from '../authorization';
import { FilesStorageClientModule } from '../files-storage-client';
import { TaskController } from './controller';
import { TaskCopyUC, TaskUC } from './uc';
import { TaskService } from './service/task.service';

@Module({
	imports: [AuthorizationModule, FilesStorageClientModule],
	controllers: [TaskController],
	providers: [
		TaskUC,
		TaskRepo,
		TaskService,
		LessonRepo,
		CourseRepo,
		TaskCopyUC,
		TaskCopyService,
		CopyHelperService,
		FileCopyAppendService,
		FeathersServiceProvider,
		FileLegacyService,
		Logger,
	],
	exports: [TaskService],
})
export class TaskModule {}
