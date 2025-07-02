import { LoggerModule } from '@core/logger';
import { VidisClientModule } from '@infra/vidis-client';
import { MediaSourceModule } from '@modules/media-source';
import { MediumMetadataModule } from '@modules/medium-metadata';
import { SchoolModule } from '@modules/school';
import { SchoolLicenseModule } from '@modules/school-license';
import { ExternalToolModule } from '@modules/tool';
import { Module } from '@nestjs/common';
import { ExternalToolMetadataUpdateService, MediaSourceSyncService } from './service';
import { BiloMetadataSyncStrategy, VidisActivationSyncStrategy, VidisMetadataSyncStrategy } from './service/strategy';

@Module({
	imports: [
		LoggerModule,
		MediaSourceModule,
		ExternalToolModule,
		MediumMetadataModule,
		SchoolLicenseModule,
		VidisClientModule,
		SchoolModule,
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
