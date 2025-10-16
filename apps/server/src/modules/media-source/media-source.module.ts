import { Module } from '@nestjs/common';
import { MediaSourceService } from './service';
import { MediaSourceRepo } from './repo';

@Module({
	imports: [],
	providers: [MediaSourceService, MediaSourceRepo],
	exports: [MediaSourceService, MediaSourceRepo],
})
export class MediaSourceModule {}
