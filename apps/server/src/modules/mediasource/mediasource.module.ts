import { Module } from '@nestjs/common';
import { MediaSourceRepo } from './repo';
import { MediaSourceService } from './service';

@Module({
	providers: [MediaSourceRepo, MediaSourceService],
	exports: [MediaSourceService, MediaSourceRepo],
})
export class MediasourceModule {}
