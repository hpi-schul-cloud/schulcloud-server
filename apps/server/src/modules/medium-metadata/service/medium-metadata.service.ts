import { MediaSource, MediaSourceDataFormat, MediaSourceService } from '@modules/media-source';
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
		private readonly mediaSourceService: MediaSourceService,
		private readonly biloStrategy: BiloStrategy,
		private readonly vidisStrategy: VidisStrategy
	) {
		this.mediumMetadataStrategyMap = new Map<MediaSourceDataFormat, MediumMetadataStrategy>();
		this.mediumMetadataStrategyMap.set(this.biloStrategy.getMediaSourceFormat(), this.biloStrategy);
		this.mediumMetadataStrategyMap.set(this.vidisStrategy.getMediaSourceFormat(), this.vidisStrategy);
	}

	public async getMetadataItem(mediumId: string, mediaSourceId: string): Promise<MediumMetadataDto> {
		const mediaSource = await this.mediaSourceService.findBySourceId(mediaSourceId);
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

		const mediaMetadata: MediumMetadataDto = await strategy.getMediumMetadataItem(mediumId, mediaSource);

		return mediaMetadata;
	}

	public async getMetadataItems(mediumIds: string[], mediaSource: MediaSource): Promise<MediumMetadataDto[]> {
		const mediaSourceDataFormat = mediaSource.format;
		if (!mediaSourceDataFormat) {
			throw new MediaSourceDataFormatNotFoundLoggableException(mediaSource.id);
		}

		const strategy = this.mediumMetadataStrategyMap.get(mediaSourceDataFormat);
		if (!strategy) {
			throw new MediumMetadataStrategyNotImplementedLoggableException(mediaSourceDataFormat);
		}

		const mediaMetadata: MediumMetadataDto[] = await strategy.getMediumMetadataItems(mediumIds, mediaSource);

		return mediaMetadata;
	}
}
