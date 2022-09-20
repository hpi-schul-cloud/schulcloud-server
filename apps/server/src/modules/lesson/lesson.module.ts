import { Module } from '@nestjs/common';
import { LessonRepo } from '@shared/repo';
import { AuthorizationModule } from '../authorization';
import { FilesStorageClientModule } from '../files-storage-client';
import { LessonController } from './controller';
import { LessonUC } from './uc';

@Module({
	imports: [AuthorizationModule, FilesStorageClientModule],
	controllers: [LessonController],
	providers: [LessonUC, LessonRepo],
})
export class LessonModule {}
