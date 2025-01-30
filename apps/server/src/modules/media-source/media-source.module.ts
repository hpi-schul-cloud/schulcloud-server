import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OauthModule } from '@modules/oauth';
import { MediaSourceRepo } from './repo';
import { MediaSourceService, MediaSourceSyncService } from './service';
// TODO barrel file
import { BiloSyncStrategy } from './service/sync/strategy/bilo-sync.strategy';

@Module({
	imports: [OauthModule, HttpModule],
	providers: [MediaSourceService, MediaSourceSyncService, MediaSourceRepo, BiloSyncStrategy],
	exports: [MediaSourceService, MediaSourceSyncService, MediaSourceRepo],
})
export class MediaSourceModule {}
