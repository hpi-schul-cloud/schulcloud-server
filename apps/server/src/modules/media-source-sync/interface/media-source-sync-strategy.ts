import { MediaSource, MediaSourceDataFormat } from '@modules/media-source';
import { MediaSourceSyncReport } from './media-source-sync-report';

export interface MediaSourceSyncStrategy {
	getMediaSourceFormat(): MediaSourceDataFormat;
	syncAllMediaMetadata(mediaSource: MediaSource): Promise<MediaSourceSyncReport>;
}
