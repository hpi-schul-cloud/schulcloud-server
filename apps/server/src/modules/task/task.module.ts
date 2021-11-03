import { Module } from '@nestjs/common';

import { CourseRepo, LessonRepo } from '@shared/repo';

import { TaskController } from './controller/task.controller';
import { TaskUC } from './uc';
import { TaskRepo } from '@shared/repo';
import { TaskAuthorizationService } from './uc/task.authorization.service';

@Module({
	imports: [],
	controllers: [TaskController],
	providers: [TaskUC, TaskRepo, TaskAuthorizationService, LessonRepo, CourseRepo],
})
export class TaskModule {}
