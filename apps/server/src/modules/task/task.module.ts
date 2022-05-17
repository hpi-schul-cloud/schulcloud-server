import { Module } from '@nestjs/common';
import { TaskCopyService } from '@shared/domain/service/task-copy.service';
import { CourseRepo, LessonRepo, TaskRepo } from '@shared/repo';
import { AuthorizationModule } from '../authorization';
import { TaskController } from './controller/task.controller';
import { TaskUC } from './uc';
import { TaskCopyUC } from './uc/task-copy.uc';

@Module({
	imports: [AuthorizationModule],
	controllers: [TaskController],
	providers: [TaskUC, TaskRepo, LessonRepo, CourseRepo, TaskCopyUC, TaskCopyService],
})
export class TaskModule {}
