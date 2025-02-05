import { MediaSourceDataFormat, MediaSourceSyncReport } from '@modules/media-source';

export interface MediaSourceSyncStrategy {
	getMediaSourceFormat(): MediaSourceDataFormat;
	syncAllMediaMetadata(): Promise<MediaSourceSyncReport>;
}
