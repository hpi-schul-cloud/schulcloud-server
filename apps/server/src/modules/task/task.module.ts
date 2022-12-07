import { Module } from '@nestjs/common';
import { CopyHelperService } from '@shared/domain';
import { FileLegacyService } from '@shared/domain/service/file-legacy.service';
import { FeathersServiceProvider } from '@shared/infra/feathers';
import { CourseRepo, LessonRepo, SubmissionRepo, TaskRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';
import { AuthorizationModule } from '../authorization';
import { FilesStorageClientModule } from '../files-storage-client';
import { SubmissionController, TaskController } from './controller';
import { TaskService } from './service/task.service';
import { SubmissionUc, TaskUC } from './uc';
import { SubmissionService } from './service';
import { TaskCopyUC } from '../learnroom/uc/task-copy.uc';
import { TaskCopyService } from '../learnroom/service';

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
