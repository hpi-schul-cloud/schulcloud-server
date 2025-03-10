import { LoggerModule } from '@core/logger';
import { CopyHelperModule } from '@modules/copy-helper';
import { FilesStorageClientModule } from '@modules/files-storage-client';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SubmissionService, TaskCopyService, TaskService } from './domain';
import { SubmissionRepo, TaskRepo } from './repo';

@Module({
	imports: [FilesStorageClientModule, CopyHelperModule, CqrsModule, LoggerModule],
	providers: [TaskService, TaskCopyService, SubmissionService, TaskRepo, SubmissionRepo],
	exports: [TaskService, TaskCopyService, SubmissionService],
})
export class TaskModule {}
