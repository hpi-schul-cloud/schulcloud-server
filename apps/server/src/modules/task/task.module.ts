import { Module } from '@nestjs/common';
import { CopyHelperService } from '@shared/domain';
import { FileCopyAppendService } from '@shared/domain/service/file-copy-append.service';
import { TaskCopyService } from '@shared/domain/service/task-copy.service';
import { CourseRepo, LessonRepo, TaskRepo } from '@shared/repo';
import { AuthorizationModule } from '../authorization';
import { FilesStorageClientModule } from '../files-storage-client';
import { TaskController } from './controller';
import { TaskCopyUC, TaskUC } from './uc';

@Module({
	imports: [AuthorizationModule, FilesStorageClientModule],
	controllers: [TaskController],
	providers: [
		TaskUC,
		TaskRepo,
		LessonRepo,
		CourseRepo,
		TaskCopyUC,
		TaskCopyService,
		CopyHelperService,
		FileCopyAppendService,
	],
})
export class TaskModule {}
