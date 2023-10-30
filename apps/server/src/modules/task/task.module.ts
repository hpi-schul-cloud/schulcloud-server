import { forwardRef, Module } from '@nestjs/common';
import { CourseRepo } from '@shared/repo/course/course.repo';
import { LessonRepo } from '@shared/repo/lesson/lesson.repo';
import { SubmissionRepo } from '@shared/repo/submission/submission.repo';
import { TaskRepo } from '@shared/repo/task/task.repo';
import { AuthorizationModule } from '../authorization/authorization.module';
import { CopyHelperModule } from '../copy-helper/copy-helper.module';
import { FilesStorageClientModule } from '../files-storage-client/files-storage-client.module';
import { SubmissionService } from './service/submission.service';
import { TaskCopyService } from './service/task-copy.service';
import { TaskService } from './service/task.service';

@Module({
	imports: [forwardRef(() => AuthorizationModule), FilesStorageClientModule, CopyHelperModule],
	providers: [TaskService, TaskCopyService, SubmissionService, TaskRepo, LessonRepo, CourseRepo, SubmissionRepo],
	exports: [TaskService, TaskCopyService, SubmissionService],
})
export class TaskModule {}
