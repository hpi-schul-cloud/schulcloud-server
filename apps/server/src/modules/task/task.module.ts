import { Module } from '@nestjs/common';
import { FileLegacyService } from '@shared/domain/service/file-legacy.service';
import { FeathersServiceProvider } from '@shared/infra/feathers';
import { CourseRepo, LessonRepo, SubmissionRepo, TaskRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';
import { AuthorizationModule } from '../authorization';
import { CopyHelperModule } from '../copy-helper/copy-helper.module';
import { FilesStorageClientModule } from '../files-storage-client';
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
		FileLegacyService,
		Logger,
		SubmissionUc,
		SubmissionService,
		SubmissionRepo,
	],
	exports: [TaskService, TaskCopyService],
})
export class TaskModule {}
