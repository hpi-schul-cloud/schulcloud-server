import { MediaSource, MediaSourceDataFormat } from '@modules/media-source';
import { MediaSourceSyncReport } from '@modules/media-source-sync';

export interface MediaActivationSyncStrategy {
	getMediaSourceFormat(): MediaSourceDataFormat;
	syncAllMediaActivations(mediaSource: MediaSource): Promise<MediaSourceSyncReport>;
}
