import { BiloMediaQueryDataResponse } from '@infra/bilo-client';
import { Injectable } from '@nestjs/common';
import { MediumMetadataResponse } from '../api/response/medium-metadata.response';
import { MediumMetadataDto } from '../dto';

@Injectable()
export class MediumMetadataMapper {
	public static mapBiloMetadataToMediumMetadata(metadataItem: BiloMediaQueryDataResponse): MediumMetadataDto {
		const mediumMetadata: MediumMetadataDto = new MediumMetadataDto({
			name: metadataItem.title,
			description: metadataItem.description,
			publisher: metadataItem.publisher,
			logoUrl: metadataItem.cover.href,
			previewLogoUrl: metadataItem.coverSmall.href,
			modifiedAt: new Date(metadataItem.modified),
		});

		return mediumMetadata;
	}

	public static mapToMediaSourceMediumMetadataResponse(mediumMetadata: MediumMetadataDto): MediumMetadataResponse {
		return new MediumMetadataResponse({ ...mediumMetadata });
	}
}
