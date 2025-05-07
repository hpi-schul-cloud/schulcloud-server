import { LoggerModule } from '@core/logger';
import { CopyHelperModule } from '@modules/copy-helper';
import { FilesStorageClientModule } from '@modules/files-storage-client';
import { Module } from '@nestjs/common';
import { SubmissionService, TaskCopyService, TaskService } from './domain';
import { SubmissionRepo, TaskRepo } from './repo';
import { DeletionModule } from '@modules/deletion';

@Module({
	imports: [FilesStorageClientModule, CopyHelperModule, LoggerModule, DeletionModule],
	providers: [TaskService, TaskCopyService, SubmissionService, TaskRepo, SubmissionRepo],
	exports: [TaskService, TaskCopyService, SubmissionService],
})
export class TaskModule {}
