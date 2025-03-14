import { MediaSourceDataFormat, MediaSourceRepo } from '@modules/media-source';
import { Injectable } from '@nestjs/common';
import { MediumMetadataDto } from '../dto';
import {
	MediaSourceDataFormatNotFoundLoggableException,
	MediaSourceNotFoundLoggableException,
	MediumMetadataStrategyNotImplementedLoggableException,
} from '../loggable';
import { BiloStrategy, MediumMetadataStrategy, VidisStrategy } from '../strategy';

@Injectable()
export class MediumMetadataService {
	private mediumMetadataStrategyMap: Map<MediaSourceDataFormat, MediumMetadataStrategy>;

	constructor(
		private readonly mediaSourceRepo: MediaSourceRepo,
		private readonly biloStrategy: BiloStrategy,
		private readonly vidisStrategy: VidisStrategy
	) {
		this.mediumMetadataStrategyMap = new Map<MediaSourceDataFormat, MediumMetadataStrategy>();
		this.mediumMetadataStrategyMap.set(this.biloStrategy.getMediaSourceFormat(), this.biloStrategy);
		this.mediumMetadataStrategyMap.set(this.vidisStrategy.getMediaSourceFormat(), this.vidisStrategy);
	}

	public async getMetadata(mediumId: string, mediaSourceId: string): Promise<MediumMetadataDto> {
		const mediaSource = await this.mediaSourceRepo.findBySourceId(mediaSourceId);
		if (!mediaSource) {
			throw new MediaSourceNotFoundLoggableException(mediaSourceId);
		}

		const mediaSourceDataFormat = mediaSource.format;
		if (!mediaSourceDataFormat) {
			throw new MediaSourceDataFormatNotFoundLoggableException(mediaSourceId);
		}

		const strategy = this.mediumMetadataStrategyMap.get(mediaSourceDataFormat);
		if (!strategy) {
			throw new MediumMetadataStrategyNotImplementedLoggableException(mediaSourceDataFormat);
		}

		const mediaMetadata: MediumMetadataDto = await strategy.getMediumMetadata(mediumId, mediaSource);

		return mediaMetadata;
	}
}
