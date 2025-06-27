import { LoggerModule } from '@core/logger';
import { BiloClientModule } from '@infra/bilo-client';
import { MediaSourceModule } from '@modules/media-source';
import { MediumMetadataModule } from '@modules/medium-metadata';
import { OauthAdapterModule } from '@modules/oauth-adapter';
import { ExternalToolModule } from '@modules/tool';
import { Module } from '@nestjs/common';
import { ExternalToolMetadataUpdateService, MediaSourceSyncService } from './service';
import { BiloMetadataSyncStrategy, VidisActivationSyncStrategy, VidisMetadataSyncStrategy } from './service/strategy';

@Module({
	imports: [
		BiloClientModule,
		LoggerModule,
		MediaSourceModule,
		OauthAdapterModule,
		ExternalToolModule,
		MediumMetadataModule,
	],
	providers: [
		MediaSourceSyncService,
		BiloMetadataSyncStrategy,
		VidisActivationSyncStrategy,
		VidisMetadataSyncStrategy,
		ExternalToolMetadataUpdateService,
	],
	exports: [MediaSourceSyncService, ExternalToolMetadataUpdateService],
})
export class MediaSourceSyncModule {}
