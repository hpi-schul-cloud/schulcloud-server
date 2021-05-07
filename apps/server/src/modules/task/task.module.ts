import { Module } from '@nestjs/common';
import { TaskController } from './controller/task.controller';
import { TaskUC } from './uc/task.uc';
import { MongooseModule } from '@nestjs/mongoose';
import { TaskRepo } from './repo/task.repo';
import { TaskSchema } from './repo/task.schema';

@Module({
	imports: [MongooseModule.forFeature([{ name: 'Task', schema: TaskSchema, collection: 'homeworks' }])],
	controllers: [TaskController],
	providers: [TaskUC, TaskRepo],
})
export class TaskModule {}
