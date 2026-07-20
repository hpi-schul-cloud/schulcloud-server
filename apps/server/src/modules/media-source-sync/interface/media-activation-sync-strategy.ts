import { type MediaSource, type MediaSourceDataFormat } from '@modules/media-source';
import { type MediaSourceSyncReport } from './media-source-sync-report';

export interface MediaActivationSyncStrategy {
	getMediaSourceFormat(): MediaSourceDataFormat;
	syncAllMediaActivations(mediaSource: MediaSource): Promise<MediaSourceSyncReport>;
}
