import { Module } from '@nestjs/common';
import { CourseRepo, LessonRepo, TaskRepo } from '@shared/repo';
import { AuthorizationModule } from '@src/modules/authorization';
import { CopyHelperModule } from '@src/modules/copy-helper/copy-helper.module';
import { SubmissionController, TaskController } from './controller';
import { TaskModule } from './task.module';
import { SubmissionUc, TaskCopyUC, TaskUC } from './uc';

@Module({
	imports: [AuthorizationModule, CopyHelperModule, TaskModule],
	controllers: [TaskController, SubmissionController],
	providers: [TaskUC, TaskRepo, LessonRepo, CourseRepo, TaskCopyUC, SubmissionUc],
})
export class TaskApiModule {}
