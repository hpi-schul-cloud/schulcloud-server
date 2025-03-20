import { MediaSourceDataFormat } from '@modules/media-source';
import { Injectable, NotImplementedException } from '@nestjs/common';
import { MediumMetadataDto } from '../dto';
import { MediumMetadataStrategy } from './interface';

@Injectable()
export class VidisStrategy implements MediumMetadataStrategy {
	public getMediaSourceFormat(): MediaSourceDataFormat {
		return MediaSourceDataFormat.VIDIS;
	}

	public getMediumMetadata(): Promise<MediumMetadataDto> {
		throw new NotImplementedException();
	}
}
