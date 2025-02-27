import { BiloMediaQueryDataResponse } from '@infra/bilo-client';
import { Injectable } from '@nestjs/common';
import { MediaMetadataDto } from '../dto';

@Injectable()
export class MediaMetadataMapper {
	public static mapToMediaMetadata(metadataItem: BiloMediaQueryDataResponse): MediaMetadataDto {
		const mediaMetadata: MediaMetadataDto = new MediaMetadataDto({
			name: metadataItem.title,
			description: metadataItem.description,
			publisher: metadataItem.publisher,
			logoUrl: metadataItem.cover.href,
			previewLogoUrl: metadataItem.coverSmall.href,
			modified: new Date(metadataItem.modified),
		});

		return mediaMetadata;
	}
}
