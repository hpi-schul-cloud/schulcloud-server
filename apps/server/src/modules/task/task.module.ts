import { Module } from '@nestjs/common';
import { TaskController } from './controller/task.controller';
import { TaskUC } from './uc/task.uc';
import { TaskRepo } from './repo/task.repo';

@Module({
	controllers: [TaskController],
	providers: [TaskUC, TaskRepo],
})
export class TaskModule {}
