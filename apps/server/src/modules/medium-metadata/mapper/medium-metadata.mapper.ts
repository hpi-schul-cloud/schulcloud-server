import { BiloMediaQueryDataResponse } from '@infra/bilo-client';
import { OfferDTO } from '@infra/vidis-client';
import { Injectable } from '@nestjs/common';
import { MediumMetadataResponse } from '../api/response';
import { MediumMetadataDto } from '../dto';

@Injectable()
export class MediumMetadataMapper {
	public static mapBiloMetadataToMediumMetadata(metadataItem: BiloMediaQueryDataResponse): MediumMetadataDto {
		const mediumMetadata: MediumMetadataDto = new MediumMetadataDto({
			mediumId: metadataItem.id,
			name: metadataItem.title,
			description: metadataItem.description,
			publisher: metadataItem.publisher,
			logoUrl: metadataItem.cover.href,
			previewLogoUrl: metadataItem.cover.href,
			modifiedAt: new Date(metadataItem.modified),
		});

		return mediumMetadata;
	}

	public static mapVidisMetadataToMediumMetadata(mediumId: string, metadataItem: OfferDTO): MediumMetadataDto {
		const mediumMetadata: MediumMetadataDto = new MediumMetadataDto({
			mediumId,
			name: metadataItem.offerTitle ?? metadataItem.offerLongTitle ?? '',
			description: metadataItem.offerDescription,
			logo: metadataItem.offerLogo,
		});

		return mediumMetadata;
	}

	public static mapToMediaSourceMediumMetadataResponse(mediumMetadata: MediumMetadataDto): MediumMetadataResponse {
		return new MediumMetadataResponse({ ...mediumMetadata });
	}
}
