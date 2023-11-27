import { CopyHelperModule } from '@modules/copy-helper';
import { FilesStorageClientModule } from '@modules/files-storage-client';
import { Module } from '@nestjs/common';
import { CourseRepo, SubmissionRepo, TaskRepo } from '@shared/repo';
import { SubmissionService, TaskCopyService, TaskService } from './service';

@Module({
	imports: [FilesStorageClientModule, CopyHelperModule],
	providers: [TaskService, TaskCopyService, SubmissionService, TaskRepo, CourseRepo, SubmissionRepo],
	exports: [TaskService, TaskCopyService, SubmissionService],
})
export class TaskModule {}
