import { Module } from '@nestjs/common';
import { MediaSourceRepo } from './repo';
import { MediaSourceService, MediaSourceSyncService } from './service';

@Module({
	providers: [MediaSourceService, MediaSourceSyncService, MediaSourceRepo],
	exports: [MediaSourceService, MediaSourceSyncService, MediaSourceRepo],
})
export class MediaSourceModule {}
