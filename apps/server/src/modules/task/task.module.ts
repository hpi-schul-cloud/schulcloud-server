import { LoggerModule } from '@core/logger';
import { CopyHelperModule } from '@modules/copy-helper';
import { CourseRepo } from '@modules/course/repo';
import { FilesStorageClientModule } from '@modules/files-storage-client';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SubmissionRepo } from '@shared/repo/submission';
import { TaskRepo } from '@shared/repo/task';
import { SubmissionService, TaskCopyService, TaskService } from './service';

@Module({
	imports: [FilesStorageClientModule, CopyHelperModule, CqrsModule, LoggerModule],
	providers: [TaskService, TaskCopyService, SubmissionService, TaskRepo, CourseRepo, SubmissionRepo],
	exports: [TaskService, TaskCopyService, SubmissionService],
})
export class TaskModule {}
