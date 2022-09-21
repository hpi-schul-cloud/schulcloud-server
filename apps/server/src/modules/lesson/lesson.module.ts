import { Module } from '@nestjs/common';
import { LessonRepo } from '@shared/repo';
import { AuthorizationModule } from '../authorization';
import { FilesStorageClientModule } from '../files-storage-client';
import { LessonController } from './controller';
import { LessonService } from './service';
import { LessonUC } from './uc';

@Module({
	imports: [FilesStorageClientModule],
	controllers: [],
	providers: [LessonRepo, LessonService],
	exports: [LessonService],
})
export class LessonModule {}

@Module({
	imports: [LessonModule, AuthorizationModule],
	controllers: [LessonController],
	providers: [LessonUC],
})
export class LessonRootModule {}
