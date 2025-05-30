import { BiloMediaQueryDataResponse } from '@infra/bilo-client';
import { OfferDTO } from '@infra/vidis-client';
import { ImageMimeType } from '@shared/domain/types';
import { MediumMetadataResponse } from '../api/response';
import { Base64SignatureUtil } from '../domain';
import { MediumMetadataDto } from '../dto';

export class MediumMetadataMapper {
	public static mapBiloMediumMetadataToMediumMetadata(metadataItem: BiloMediaQueryDataResponse): MediumMetadataDto {
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
		let logoUrl: string | undefined;

		if (metadataItem.offerLogo) {
			const contentType: ImageMimeType | undefined = Base64SignatureUtil.detectLogoImageType(metadataItem.offerLogo);

			logoUrl = contentType ? `data:${contentType.valueOf()};base64,${metadataItem.offerLogo}` : undefined;
		}

		const mediumMetadata: MediumMetadataDto = new MediumMetadataDto({
			mediumId,
			name: metadataItem.offerTitle ?? metadataItem.offerLongTitle ?? '',
			description: metadataItem.offerDescription,
			logoUrl,
		});

		return mediumMetadata;
	}

	public static mapToMediaSourceMediumMetadataResponse(mediumMetadata: MediumMetadataDto): MediumMetadataResponse {
		return new MediumMetadataResponse({ ...mediumMetadata });
	}
}
