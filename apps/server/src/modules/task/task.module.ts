import { CopyHelperModule } from '@modules/copy-helper';
import { FilesStorageClientModule } from '@modules/files-storage-client';
import { Module } from '@nestjs/common';
import { CourseRepo, LessonRepo } from '@shared/repo';
import { SubmissionService, TaskCopyService, TaskService } from './service';
import { SubmissionRepo, TaskRepo } from './repo';

@Module({
	imports: [FilesStorageClientModule, CopyHelperModule],
	// to many repos declared as provider
	providers: [TaskService, TaskCopyService, SubmissionService, TaskRepo, LessonRepo, CourseRepo, SubmissionRepo],
	exports: [TaskService, TaskCopyService, SubmissionService],
})
export class TaskModule {}
