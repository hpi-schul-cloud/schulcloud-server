import { forwardRef, Module } from '@nestjs/common';
import { CourseRepo, LessonRepo, SubmissionRepo, TaskRepo } from '@shared/repo';
import { AuthorizationModule } from '@modules/authorization';
import { CopyHelperModule } from '@modules/copy-helper';
import { FilesStorageClientModule } from '@modules/files-storage-client';
import { SubmissionService, TaskCopyService, TaskService } from './service';

@Module({
	imports: [forwardRef(() => AuthorizationModule), FilesStorageClientModule, CopyHelperModule],
	providers: [TaskService, TaskCopyService, SubmissionService, TaskRepo, LessonRepo, CourseRepo, SubmissionRepo],
	exports: [TaskService, TaskCopyService, SubmissionService],
})
export class TaskModule {}
