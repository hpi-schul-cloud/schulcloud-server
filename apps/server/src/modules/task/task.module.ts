import { Module } from '@nestjs/common';
import { TaskController } from './controller';
import { TaskUC } from './uc';
import { TaskRepo, LessonRepo, SubmissionRepo } from './repo';
import { UserFacade } from '../user';

@Module({
	controllers: [TaskController],
	providers: [TaskUC, TaskRepo, SubmissionRepo, LessonRepo],
	imports: [UserFacade],
})
export class TaskModule {}
