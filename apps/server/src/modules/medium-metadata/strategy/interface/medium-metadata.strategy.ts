import { MediaSource, MediaSourceDataFormat } from '@modules/media-source';
import { MediumMetadataDto } from '../../dto';

export interface MediumMetadataStrategy {
	getMediaSourceFormat(): MediaSourceDataFormat;
	getMediumMetadataItem(mediumId: string, mediaSource: MediaSource): Promise<MediumMetadataDto>;
	getMediumMetadataItems(mediumIds: string[], mediaSource: MediaSource): Promise<MediumMetadataDto[]>;
}
