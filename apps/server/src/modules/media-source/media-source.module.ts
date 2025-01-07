import { Module } from '@nestjs/common';
import { MediaSourceRepo } from './repo';
import { MediaSourceService } from './service';

@Module({
	providers: [MediaSourceService, MediaSourceRepo],
	exports: [MediaSourceService, MediaSourceRepo],
})
export class MediaSourceModule {}
