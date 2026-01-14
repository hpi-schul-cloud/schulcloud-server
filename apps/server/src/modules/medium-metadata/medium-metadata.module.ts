import { BiloClientModule } from '@infra/bilo-client';
import { VidisClientModule } from '@infra/vidis-client';
import { Module } from '@nestjs/common';
import { MediaSourceModule } from '../media-source';
import { EncryptionConfig } from './encryption.config';
import { MediumMetadataService } from './service';
import { BiloStrategy, VidisStrategy } from './strategy';

@Module({
	imports: [
		BiloClientModule.register(EncryptionConfig),
		MediaSourceModule,
		VidisClientModule.register(EncryptionConfig),
	],
	providers: [BiloStrategy, VidisStrategy, MediumMetadataService],
	exports: [MediumMetadataService],
})
export class MediumMetadataModule {}
