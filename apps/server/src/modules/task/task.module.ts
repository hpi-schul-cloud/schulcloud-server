import { Module } from '@nestjs/common';
import { CopyHelperService } from '@shared/domain';
import { FileLegacyService } from '@shared/domain/service/file-legacy.service';
import { FeathersServiceProvider } from '@shared/infra/feathers';
import { CourseRepo, LessonRepo, TaskRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';
import { AuthorizationModule } from '../authorization';
import { FilesStorageClientModule } from '../files-storage-client';
import { TaskController } from './controller';
import { TaskUC } from './uc';
import { TaskService } from './service/task.service';
import { TaskCopyUC } from '../learnroom/uc/task-copy.uc';
import { TaskCopyService } from '../learnroom/service';

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
		FeathersServiceProvider,
		FileLegacyService,
		Logger,
	],
	exports: [TaskService],
})
export class TaskModule {}
