import { LoggerModule } from '@core/logger';
import { Module } from '@nestjs/common';
import { BiloClientModule } from '@infra/bilo-client';
import { MediaSourceModule } from '@modules/media-source';
import { OauthAdapterModule } from '@modules/oauth-adapter';
import { ExternalToolModule } from '@modules/tool/external-tool/external-tool.module';
import { MediaSourceSyncService } from './service';
import { BiloSyncStrategy } from './service/strategy';

@Module({
	imports: [BiloClientModule, LoggerModule, MediaSourceModule, OauthAdapterModule, ExternalToolModule],
	providers: [MediaSourceSyncService, BiloSyncStrategy],
	exports: [MediaSourceSyncService],
})
export class MediaSourceSyncModule {}
