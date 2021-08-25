import { Module } from '@nestjs/common';

import { CourseRepo } from '@src/repositories';

import { TaskController } from './controller/task.controller';
import { TaskUC } from './uc';
import { SubmissionRepo, TaskRepo } from './repo';

@Module({
	imports: [],
	controllers: [TaskController],
	providers: [TaskUC, TaskRepo, SubmissionRepo, CourseRepo],
})
export class TaskModule {}
