import { Module } from '@nestjs/common';
import { CardElementRepo, CourseRepo, RichTextCardElementRepo, TaskCardRepo } from '@shared/repo';
import { AuthorizationModule } from '../authorization/authorization.module';
import { TaskModule } from '../task/task.module';
import { TaskCardController } from './controller/task-card.controller';
import { TaskCardUc } from './uc/task-card.uc';

@Module({
	imports: [AuthorizationModule, TaskModule],
	controllers: [TaskCardController],
	providers: [TaskCardUc, CardElementRepo, CourseRepo, TaskCardRepo, RichTextCardElementRepo],
	exports: [],
})
export class TaskCardModule {}
