import { Module } from '@nestjs/common';

import { LearnroomModule } from '../learnroom';
import { TaskController } from './controller/task.controller';
import { TaskUC } from './uc';
import { SubmissionRepo, TaskRepo } from './repo';

@Module({
	imports: [LearnroomModule],
	controllers: [TaskController],
	providers: [TaskUC, TaskRepo, SubmissionRepo],
})
export class TaskModule {}
