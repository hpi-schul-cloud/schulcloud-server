import { OfferDTO, VidisClientAdapter } from '@infra/vidis-client';
import { MediaSource, MediaSourceDataFormat } from '@modules/media-source';
import { Injectable } from '@nestjs/common';
import { ImageMimeType } from '@shared/domain/types';
import { MediumMetadataDto } from '../dto';
import { MediumNotFoundLoggableException } from '../loggable';
import { MediumMetadataMapper } from '../mapper';
import { MediumMetadataLogoService } from '../service/medium-metadata-logo.service';
import { MediumMetadataStrategy } from './interface';

@Injectable()
export class VidisStrategy implements MediumMetadataStrategy {
	constructor(
		private readonly vidisClientAdapter: VidisClientAdapter,
		private readonly mediumMetadataLogoService: MediumMetadataLogoService
	) {}

	public getMediaSourceFormat(): MediaSourceDataFormat {
		return MediaSourceDataFormat.VIDIS;
	}

	public async getMediumMetadataItem(mediumId: string, mediaSource: MediaSource): Promise<MediumMetadataDto> {
		const metadataItems: OfferDTO[] = await this.vidisClientAdapter.getOfferItemsByRegion(mediaSource);

		const requestedMetadataItem: OfferDTO | undefined = metadataItems.find(
			(item: OfferDTO) => item.offerId?.toString() === mediumId
		);

		if (!requestedMetadataItem) {
			throw new MediumNotFoundLoggableException(mediumId, mediaSource.sourceId);
		}

		const mediumMetadataDto = MediumMetadataMapper.mapVidisMetadataToMediumMetadata(mediumId, requestedMetadataItem);

		if (mediumMetadataDto.logo) {
			const contentType: ImageMimeType | undefined = this.mediumMetadataLogoService.detectAndValidateLogoImageType(
				mediumMetadataDto.logo
			);

			mediumMetadataDto.logoUrl = contentType
				? `data:${contentType.valueOf()};base64,${mediumMetadataDto.logo}`
				: undefined;
		}

		return mediumMetadataDto;
	}

	public async getMediumMetadataItems(mediumIds: string[], mediaSource: MediaSource): Promise<MediumMetadataDto[]> {
		const metadataItems: OfferDTO[] = await this.vidisClientAdapter.getOfferItemsByRegion(mediaSource);

		const mediumMetadataDtos: MediumMetadataDto[] = [];
		const mediumIdSet = new Set(mediumIds);
		for (const item of metadataItems) {
			const offerId: string | undefined = item.offerId?.toString();
			if (offerId && mediumIdSet.has(offerId)) {
				mediumMetadataDtos.push(MediumMetadataMapper.mapVidisMetadataToMediumMetadata(offerId, item));
			}
		}

		return mediumMetadataDtos;
	}
}
