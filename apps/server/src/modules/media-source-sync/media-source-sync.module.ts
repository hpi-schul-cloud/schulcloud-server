import { LoggerModule } from '@core/logger';
import { BiloClientModule } from '@infra/bilo-client';
import { MediaSourceModule } from '@modules/media-source';
import { OauthAdapterModule } from '@modules/oauth-adapter';
import { Module } from '@nestjs/common';
import { MediaSourceSyncService } from './service';
import { BiloSyncStrategy } from './service/strategy';

@Module({
	imports: [BiloClientModule, LoggerModule, MediaSourceModule, OauthAdapterModule],
	providers: [MediaSourceSyncService, BiloSyncStrategy],
	exports: [MediaSourceSyncService],
})
export class MediaSourceSyncModule {}
