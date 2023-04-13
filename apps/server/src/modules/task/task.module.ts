import { Module } from '@nestjs/common';
import { FeathersServiceProvider } from '@shared/infra/feathers';
import { CourseRepo, LessonRepo, SubmissionRepo, TaskCardRepo, TaskRepo, UserRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';
import { AuthorizationModule } from '@src/modules/authorization';
import { CopyHelperModule } from '@src/modules/copy-helper/copy-helper.module';
import { FilesStorageClientModule } from '@src/modules/files-storage-client';
import { TaskCardService } from '../task-card/service/task-card.service';
import { SubmissionController, TaskController } from './controller';
import { SubmissionService, TaskCopyService, TaskService } from './service';
import { SubmissionUc, TaskCopyUC, TaskUC } from './uc';

@Module({
	imports: [AuthorizationModule, FilesStorageClientModule, CopyHelperModule],
	controllers: [TaskController, SubmissionController],
	providers: [
		TaskUC,
		TaskRepo,
		TaskService,
		LessonRepo,
		CourseRepo,
		TaskCopyUC,
		TaskCopyService,
		FeathersServiceProvider,
		Logger,
		SubmissionUc,
		SubmissionService,
		SubmissionRepo,
		UserRepo,
		TaskCardService,
		TaskCardRepo,
	],
	exports: [TaskService, TaskCopyService],
})
export class TaskModule {}
