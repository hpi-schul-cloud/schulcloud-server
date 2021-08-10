import { Module } from '@nestjs/common';
import { TaskController } from './controller/task.controller';
import { TaskUC } from './uc/task.uc';
import { TaskRepo } from './repo/task.repo';
import { SubmissionRepo } from './repo/submission.repo';
import { TaskSubmissionMetadataService } from './domain/task-submission-metadata.service';

@Module({
	controllers: [TaskController],
	providers: [TaskUC, TaskRepo, SubmissionRepo, TaskSubmissionMetadataService],
})
export class TaskModule {}
