import { MediaSource, MediaSourceDataFormat } from '@modules/media-source';
import { MediaMetadataDto } from '../dto';
import { MediaSourceSyncReport } from './media-source-sync-report';

export interface MediaSourceSyncStrategy {
	getMediaSourceFormat(): MediaSourceDataFormat;
	syncAllMediaMetadata(mediaSource: MediaSource): Promise<MediaSourceSyncReport>;
	fetchMediaMetadata(mediumId: string, mediaSource: MediaSource): Promise<MediaMetadataDto>;
}
