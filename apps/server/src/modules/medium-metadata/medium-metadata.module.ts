import { BiloClientModule } from '@infra/bilo-client';
import { Module } from '@nestjs/common';
import { MediaSourceModule } from '../media-source';
import { MediumMetadataService } from './service';
import { BiloStrategy, VidisStrategy } from './strategy';

@Module({
	imports: [BiloClientModule, MediaSourceModule],
	providers: [BiloStrategy, VidisStrategy, MediumMetadataService],
	exports: [MediumMetadataService],
})
export class MediumMetadataModule {}
