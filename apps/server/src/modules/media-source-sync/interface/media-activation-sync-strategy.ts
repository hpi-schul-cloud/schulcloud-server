import { type MediaSource, type MediaSourceDataFormat } from '@modules/media-source';
import { type MediaSourceSyncReport } from '@modules/media-source-sync';

export interface MediaActivationSyncStrategy {
	getMediaSourceFormat(): MediaSourceDataFormat;
	syncAllMediaActivations(mediaSource: MediaSource): Promise<MediaSourceSyncReport>;
}
