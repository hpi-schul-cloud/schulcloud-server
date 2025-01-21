import { CopyHelperModule } from '@modules/copy-helper';
import { FilesStorageClientModule } from '@modules/files-storage-client';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CourseRepo } from '@shared/repo/course';
import { SubmissionRepo } from '@shared/repo/submission';
import { TaskRepo } from '@shared/repo/task';
import { LoggerModule } from '@src/core/logger';
import { SubmissionService, TaskCopyService, TaskService } from './service';

@Module({
	imports: [FilesStorageClientModule, CopyHelperModule, CqrsModule, LoggerModule],
	providers: [TaskService, TaskCopyService, SubmissionService, TaskRepo, CourseRepo, SubmissionRepo],
	exports: [TaskService, TaskCopyService, SubmissionService],
})
export class TaskModule {}
