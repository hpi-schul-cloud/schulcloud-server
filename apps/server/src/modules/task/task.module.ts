import { Module } from '@nestjs/common';
import { TaskController } from './controller/task.controller';
import { TaskService } from './uc/task.uc';
import { TaskRepo } from './repo/task.repo';

@Module({
	controllers: [TaskController],
	providers: [TaskService, TaskRepo],
})
export class TaskModule {}
