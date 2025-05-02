import { LoggerModule } from '@core/logger';
import { CopyHelperModule } from '@modules/copy-helper';
import { FilesStorageClientModule } from '@modules/files-storage-client';
import { SagaModule } from '@modules/saga';
import { Module } from '@nestjs/common';
import { SubmissionService, TaskCopyService, TaskService } from './domain';
import { SubmissionRepo, TaskRepo } from './repo';
import { DeleteUserSubmissionDataStep, DeleteUserTaskDataStep } from './saga';

@Module({
	imports: [FilesStorageClientModule, CopyHelperModule, LoggerModule, SagaModule],
	providers: [
		TaskService,
		TaskCopyService,
		SubmissionService,
		TaskRepo,
		SubmissionRepo,
		DeleteUserSubmissionDataStep,
		DeleteUserTaskDataStep,
	],
	exports: [TaskService, TaskCopyService, SubmissionService],
})
export class TaskModule {}
