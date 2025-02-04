import { Module } from '@nestjs/common';
import { OauthModule } from '@modules/oauth';
import { ExternalToolModule } from '@modules/tool';
import { BiloMediaFetchService, MediaSourceService, MediaSourceSyncService } from './service';
import { MediaSourceRepo } from './repo';
import { BiloSyncStrategy } from './strategy';

@Module({
	imports: [OauthModule, ExternalToolModule],
	providers: [MediaSourceService, MediaSourceSyncService, MediaSourceRepo, BiloMediaFetchService, BiloSyncStrategy],
	exports: [MediaSourceService, MediaSourceSyncService, MediaSourceRepo],
})
export class MediaSourceModule {}
