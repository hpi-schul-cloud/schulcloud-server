import { BiloMediaQueryDataResponse } from '@infra/bilo-client';
import { MediaMetadataDto } from '../dto';

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
