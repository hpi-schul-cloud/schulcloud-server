import { forwardRef, Module } from '@nestjs/common';
import { CourseRepo, LessonRepo, SubmissionRepo, TaskRepo, UserRepo } from '@shared/repo';
import { AuthorizationModule } from '@src/modules/authorization';
import { CopyHelperModule } from '@src/modules/copy-helper';
import { FilesStorageClientModule } from '@src/modules/files-storage-client';
import { SubmissionService, TaskCopyService, TaskService } from './service';

@Module({
	imports: [forwardRef(() => AuthorizationModule), FilesStorageClientModule, CopyHelperModule],
	providers: [
		TaskService,
		TaskCopyService,
		SubmissionService,
		TaskRepo,
		LessonRepo,
		CourseRepo,
		SubmissionRepo,
		UserRepo,
	],
	exports: [TaskService, TaskCopyService, SubmissionService],
})
export class TaskModule {}
