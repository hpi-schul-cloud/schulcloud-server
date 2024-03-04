import { CopyHelperModule } from '@modules/copy-helper';
import { FilesStorageClientModule } from '@modules/files-storage-client';
import { Module } from '@nestjs/common';
import { CourseRepo, SubmissionRepo, TaskRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { CqrsModule } from '@nestjs/cqrs';
import { SubmissionService, TaskCopyService, TaskService } from './service';

@Module({
	imports: [FilesStorageClientModule, CopyHelperModule, CqrsModule, LoggerModule],
	providers: [TaskService, TaskCopyService, SubmissionService, TaskRepo, CourseRepo, SubmissionRepo],
	exports: [TaskService, TaskCopyService, SubmissionService],
})
export class TaskModule {}
