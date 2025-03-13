import { BiloMediaClientAdapter, BiloMediaQueryDataResponse } from '@infra/bilo-client';
import { MediaSource, MediaSourceDataFormat } from '@modules/media-source';
import { Injectable } from '@nestjs/common';
import { MediumMetadataDto } from '../dto';
import { MediumMetadataMapper } from '../mapper';
import { MediumMetadataStrategy } from './interface';

@Injectable()
export class BiloStrategy implements MediumMetadataStrategy {
	constructor(private readonly biloMediaClientAdapter: BiloMediaClientAdapter) {}

	public getMediaSourceFormat(): MediaSourceDataFormat {
		return MediaSourceDataFormat.BILDUNGSLOGIN;
	}

	public async getMediumMetadata(mediumId: string, mediaSource: MediaSource): Promise<MediumMetadataDto> {
		const metadataItems: BiloMediaQueryDataResponse[] = await this.biloMediaClientAdapter.fetchMediaMetadata(
			[mediumId],
			mediaSource,
			true
		);

		const mediumMetadataDto: MediumMetadataDto = MediumMetadataMapper.mapBiloMetadataToMediumMetadata(metadataItems[0]);

		return mediumMetadataDto;
	}
}
