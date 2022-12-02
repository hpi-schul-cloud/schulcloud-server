import { Module } from '@nestjs/common';
import { CopyHelperService } from '@shared/domain';
import { FileCopyAppendService } from '@shared/domain/service/file-copy-append.service';
import { FileLegacyService } from '@shared/domain/service/file-legacy.service';
import { TaskCopyService } from '@shared/domain/service/task-copy.service';
import { FeathersServiceProvider } from '@shared/infra/feathers';
import { CourseRepo, LessonRepo, SubmissionRepo, TaskRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';
import { AuthorizationModule } from '../authorization';
import { FilesStorageClientModule } from '../files-storage-client';
import { SubmissionController, TaskController } from './controller';
import { TaskService, SubmissionService } from './service';
import { SubmissionUc, TaskCopyUC, TaskUC } from './uc';

@Module({
	imports: [AuthorizationModule, FilesStorageClientModule],
	controllers: [TaskController, SubmissionController],
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
		SubmissionUc,
		SubmissionService,
		SubmissionRepo,
	],
	exports: [TaskService],
})
export class TaskModule {}
