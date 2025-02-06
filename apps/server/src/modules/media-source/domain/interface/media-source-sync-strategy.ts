import { MediaSourceDataFormat } from '../../enum';
import { MediaSource } from '../do';
import { MediaSourceSyncReport } from './media-source-sync-report';

export interface MediaSourceSyncStrategy {
	getMediaSourceFormat(): MediaSourceDataFormat;
	syncAllMediaMetadata(mediaSource: MediaSource): Promise<MediaSourceSyncReport>;
}
