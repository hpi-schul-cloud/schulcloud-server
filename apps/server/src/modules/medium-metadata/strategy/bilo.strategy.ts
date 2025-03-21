import { BiloMediaClientAdapter, BiloMediaQueryDataResponse } from '@infra/bilo-client';
import { MediaSource, MediaSourceDataFormat } from '@modules/media-source';
import { Injectable } from '@nestjs/common';
import { MediumMetadataDto } from '../dto';
import {
	MediumMetadataNotFoundLoggableException,
	MediumMetadataStrategyNotImplementedLoggableException,
} from '../loggable';
import { MediumMetadataMapper } from '../mapper';
import { MediumMetadataStrategy } from './interface';

@Injectable()
export class BiloStrategy implements MediumMetadataStrategy {
	constructor(private readonly biloMediaClientAdapter: BiloMediaClientAdapter) {}

	public getMediaSourceFormat(): MediaSourceDataFormat {
		return MediaSourceDataFormat.BILDUNGSLOGIN;
	}

	public async getMediumMetadataItem(mediumId: string, mediaSource: MediaSource): Promise<MediumMetadataDto> {
		const metadataItems: BiloMediaQueryDataResponse[] = await this.biloMediaClientAdapter.fetchMediaMetadata(
			[mediumId],
			mediaSource,
			true
		);

		if (!metadataItems.length) {
			throw new MediumMetadataNotFoundLoggableException(mediumId, mediaSource.sourceId);
		}

		const mediumMetadataDto: MediumMetadataDto = MediumMetadataMapper.mapBiloMetadataToMediumMetadata(metadataItems[0]);

		return mediumMetadataDto;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async getMediumMetadataItems(mediumIds: string[], mediaSource: MediaSource): Promise<MediumMetadataDto[]> {
		await Promise.resolve();
		throw new MediumMetadataStrategyNotImplementedLoggableException(MediaSourceDataFormat.BILDUNGSLOGIN);
	}
}
