import { Module } from '@nestjs/common';
import { CardElementRepo, CourseRepo, RichTextCardElementRepo, TaskCardRepo, TaskRepo } from '@shared/repo';
import { AuthorizationModule } from '../authorization/authorization.module';
import { FilesStorageClientModule } from '../files-storage-client';
import { TaskModule } from '../task/task.module';
import { TaskCardController } from './controller/task-card.controller';
import { TaskCardUc } from './uc/task-card.uc';

@Module({
	imports: [AuthorizationModule, TaskModule, FilesStorageClientModule],
	controllers: [TaskCardController],
	providers: [TaskCardUc, CardElementRepo, CourseRepo, TaskRepo, TaskCardRepo, RichTextCardElementRepo],
	exports: [],
})
export class TaskCardModule {}
