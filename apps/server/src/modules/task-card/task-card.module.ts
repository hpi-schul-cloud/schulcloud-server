import { Module } from '@nestjs/common';
import { AuthorizationModule } from '@src/modules';
import { TaskCardController } from './controller/task-card.controller';
import { TaskCardUc } from './uc';
import { TaskCardRepo } from '@shared/repo';
import { TaskService } from '@src/modules/task/service';

@Module({
	imports: [AuthorizationModule],
	controllers: [TaskCardController],
	providers: [TaskCardUc, TaskCardRepo, TaskService],
	exports: [],
})
export class TaskCardModule {}
