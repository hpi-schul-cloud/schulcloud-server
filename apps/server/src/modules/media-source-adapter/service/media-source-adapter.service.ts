import { MediaSourceSyncService } from '@modules/media-source-sync';
import { MediaSourceDataFormat } from '@modules/media-source';
import { MediaMetadataDto } from '../../media-source-sync/dto';

export class MediaSourceAdapterService {
	constructor(private readonly mediaSourceSyncService: MediaSourceSyncService) {}

	public async fetchMediumMetadata(
		mediumId: string,
		mediaSourceFormat: MediaSourceDataFormat | undefined
	): Promise<MediaMetadataDto> {
		const mediaMetadataDto: MediaMetadataDto = await this.mediaSourceSyncService.fetchMediumMetadata(
			mediumId,
			mediaSourceFormat
		);

		return mediaMetadataDto;
	}
}
