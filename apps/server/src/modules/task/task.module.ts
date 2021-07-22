import { Module } from '@nestjs/common';
import { TaskController } from './controller/task.controller';
import { TaskUC } from './uc/task.uc';
import { TaskRepo } from './repo/task.repo';
import { SubmissionRepo } from './repo/submission.repo';

@Module({
	controllers: [TaskController],
	providers: [TaskUC, TaskRepo, SubmissionRepo, { provide: 'ITaskSubmission', useClass: SubmissionRepo }],
})
export class TaskModule {}
