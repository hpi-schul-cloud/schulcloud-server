import { Module } from '@nestjs/common';

import { CourseRepo } from '@src/repositories';

import { TaskController } from './controller/task.controller';
import { TaskUC } from './uc';
import { TaskRepo } from './repo';
import { TaskAuthorizationService } from './uc/task.authorization.service';

@Module({
	imports: [],
	controllers: [TaskController],
	providers: [TaskUC, TaskRepo, TaskAuthorizationService, CourseRepo],
})
export class TaskModule {}
