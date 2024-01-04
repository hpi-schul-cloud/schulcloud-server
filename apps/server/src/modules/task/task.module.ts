import { CopyHelperModule } from '@modules/copy-helper';
import { FilesStorageClientModule } from '@modules/files-storage-client';
import { Module } from '@nestjs/common';
import { CourseRepo, SubmissionRepo, TaskRepo } from '@shared/repo';
import { UserModule } from '@modules/user';
import { SubmissionService, TaskCopyService, TaskService } from './service';

@Module({
	imports: [FilesStorageClientModule, CopyHelperModule, UserModule],
	providers: [TaskService, TaskCopyService, SubmissionService, TaskRepo, CourseRepo, SubmissionRepo],
	exports: [TaskService, TaskCopyService, SubmissionService],
})
export class TaskModule {}
