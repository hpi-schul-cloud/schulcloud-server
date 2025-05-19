import { BiloClientModule } from '@infra/bilo-client';
import { VidisClientModule } from '@infra/vidis-client';
import { Module } from '@nestjs/common';
import { MediaSourceModule } from '../media-source';
import { MediumMetadataService } from './service';
import { MediumMetadataLogoService } from './service/medium-metadata-logo.service';
import { BiloStrategy, VidisStrategy } from './strategy';

@Module({
	imports: [BiloClientModule, MediaSourceModule, VidisClientModule],
	providers: [BiloStrategy, VidisStrategy, MediumMetadataService, MediumMetadataLogoService],
	exports: [MediumMetadataService, MediumMetadataLogoService],
})
export class MediumMetadataModule {}
