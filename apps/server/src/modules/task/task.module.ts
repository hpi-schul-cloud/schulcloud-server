import { Module } from '@nestjs/common';

import { LearnroomModule } from '../learnroom';
import { TaskController } from './controller/task.controller';
import { TaskUC } from './uc';
import { SubmissionRepo, TaskRepo } from './repo';
import { TaskSubmissionMetadataService } from './domain/task-submission-metadata.service';

@Module({
	imports: [LearnroomModule],
	controllers: [TaskController],
	providers: [TaskUC, TaskRepo, SubmissionRepo, TaskSubmissionMetadataService],
})
export class TaskModule {}
