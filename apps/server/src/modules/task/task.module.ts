import { Module } from '@nestjs/common';
import { TaskCopyService } from '@shared/domain/service/task-copy.service';
import { CourseRepo, LessonRepo, TaskRepo } from '@shared/repo';
import { AuthorizationModule } from '../authorization';
import { FilesStorageClientModule } from '../files-storage-client';
import { TaskController } from './controller';
import { TaskUC, TaskCopyUC } from './uc';

@Module({
	imports: [AuthorizationModule, FilesStorageClientModule],
	controllers: [TaskController],
	providers: [TaskUC, TaskRepo, LessonRepo, CourseRepo, TaskCopyUC, TaskCopyService],
})
export class TaskModule {}
