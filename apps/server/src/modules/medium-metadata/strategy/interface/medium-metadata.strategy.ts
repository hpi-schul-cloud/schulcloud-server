import { type MediaSource, type MediaSourceDataFormat } from '@modules/media-source';
import { type MediumMetadataDto } from '../../dto';

export interface MediumMetadataStrategy {
	getMediaSourceFormat(): MediaSourceDataFormat;
	getMediumMetadataItem(mediumId: string, mediaSource: MediaSource): Promise<MediumMetadataDto>;
	getMediumMetadataItems(mediumIds: string[], mediaSource: MediaSource): Promise<MediumMetadataDto[]>;
}
