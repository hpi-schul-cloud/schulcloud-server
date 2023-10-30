import { Module } from '@nestjs/common';
import { CourseRepo } from '@shared/repo/course/course.repo';
import { LessonRepo } from '@shared/repo/lesson/lesson.repo';
import { TaskRepo } from '@shared/repo/task/task.repo';
import { AuthorizationModule } from '../authorization/authorization.module';
import { CopyHelperModule } from '../copy-helper/copy-helper.module';
import { SubmissionController } from './controller/submission.controller';
import { TaskController } from './controller/task.controller';
import { TaskModule } from './task.module';
import { SubmissionUc } from './uc/submission.uc';
import { TaskCopyUC } from './uc/task-copy.uc';
import { TaskUC } from './uc/task.uc';

@Module({
	imports: [AuthorizationModule, CopyHelperModule, TaskModule],
	controllers: [TaskController, SubmissionController],
	providers: [TaskUC, TaskRepo, LessonRepo, CourseRepo, TaskCopyUC, SubmissionUc],
})
export class TaskApiModule {}
