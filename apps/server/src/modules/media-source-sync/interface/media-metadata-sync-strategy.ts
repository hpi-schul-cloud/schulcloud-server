import { type MediaSource, type MediaSourceDataFormat } from '@modules/media-source';
import { type MediaSourceSyncReport } from './media-source-sync-report';

export interface MediaMetadataSyncStrategy {
	getMediaSourceFormat(): MediaSourceDataFormat;
	syncAllMediaMetadata(mediaSource: MediaSource): Promise<MediaSourceSyncReport>;
}
