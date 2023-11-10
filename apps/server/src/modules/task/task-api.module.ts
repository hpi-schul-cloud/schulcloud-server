import { AuthorizationModule } from '@modules/authorization';
import { CopyHelperModule } from '@modules/copy-helper/copy-helper.module';
import { Module } from '@nestjs/common';
import { CourseRepo, TaskRepo } from '@shared/repo';
import { LessonModule } from '../lesson';
import { SubmissionController, TaskController } from './controller';
import { TaskModule } from './task.module';
import { SubmissionUc, TaskCopyUC, TaskUC } from './uc';

@Module({
	imports: [AuthorizationModule, CopyHelperModule, TaskModule, LessonModule],
	controllers: [TaskController, SubmissionController],
	providers: [TaskUC, TaskRepo, CourseRepo, TaskCopyUC, SubmissionUc],
})
export class TaskApiModule {}
