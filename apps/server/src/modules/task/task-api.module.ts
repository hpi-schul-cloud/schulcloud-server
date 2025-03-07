import { AuthorizationModule } from '@modules/authorization';
import { CopyHelperModule } from '@modules/copy-helper/copy-helper.module';
import { CourseModule } from '@modules/course';
import { LessonModule } from '@modules/lesson';
import { Module } from '@nestjs/common';
import { SubmissionController, SubmissionUc, TaskController, TaskCopyUC, TaskUC } from './api';
import { TaskRepo } from './repo';
import { TaskModule } from './task.module';
@Module({
	imports: [AuthorizationModule, CopyHelperModule, TaskModule, LessonModule, CourseModule],
	controllers: [TaskController, SubmissionController],
	providers: [TaskUC, TaskRepo, TaskCopyUC, SubmissionUc],
})
export class TaskApiModule {}
