import { BiloClientModule } from '@infra/bilo-client';
import { VidisClientModule } from '@infra/vidis-client';
import { Module } from '@nestjs/common';
import { MediaSourceModule } from '../media-source';
import { MEDIUM_METADATA_ENCRYPTION_CONFIG_TOKEN, MediumMetadataEncryptionConfig } from './encryption.config';
import { MediumMetadataService } from './service';
import { BiloStrategy, VidisStrategy } from './strategy';

@Module({
	imports: [
		BiloClientModule.register(MediumMetadataEncryptionConfig, MEDIUM_METADATA_ENCRYPTION_CONFIG_TOKEN),
		MediaSourceModule,
		VidisClientModule.register(MediumMetadataEncryptionConfig, MEDIUM_METADATA_ENCRYPTION_CONFIG_TOKEN),
	],
	providers: [BiloStrategy, VidisStrategy, MediumMetadataService],
	exports: [MediumMetadataService],
})
export class MediumMetadataModule {}
