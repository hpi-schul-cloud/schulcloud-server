import { Module } from '@nestjs/common';
import { LessonRepo } from '@shared/repo';
import { FilesStorageClientModule } from '../files-storage-client';
import { LessonService } from './service';

@Module({
	imports: [FilesStorageClientModule],
	controllers: [],
	providers: [LessonRepo, LessonService],
	exports: [LessonService],
})
export class LessonModule {}
