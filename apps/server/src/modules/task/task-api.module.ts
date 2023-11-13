import { Module } from '@nestjs/common';
import { AuthorizationModule } from '@modules/authorization';
import { CopyHelperModule } from '@modules/copy-helper/copy-helper.module';
import { CourseRepo, LessonRepo } from '@shared/repo';
import { SubmissionController, TaskController } from './controller';
import { TaskModule } from './task.module';
import { SubmissionUc, TaskCopyUC, TaskUC } from './uc';
import { TaskRepo } from './repo';

@Module({
	imports: [AuthorizationModule, CopyHelperModule, TaskModule],
	controllers: [TaskController, SubmissionController],
	// repos should not be part of the api module
	providers: [TaskRepo, CourseRepo, LessonRepo, TaskUC, TaskCopyUC, SubmissionUc],
})
export class TaskApiModule {}
