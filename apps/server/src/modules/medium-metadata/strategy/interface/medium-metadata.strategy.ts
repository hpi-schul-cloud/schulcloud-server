import { MediaSource, MediaSourceDataFormat } from '@modules/media-source';
import { MediumMetadataDto } from '../../dto';

export interface MediumMetadataStrategy {
	getMediaSourceFormat(): MediaSourceDataFormat;
	getMediumMetadata(mediumId: string, mediaSource: MediaSource): Promise<MediumMetadataDto>;
}
