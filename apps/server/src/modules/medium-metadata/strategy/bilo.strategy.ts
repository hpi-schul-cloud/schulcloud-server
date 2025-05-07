import { BiloMediaClientAdapter, BiloMediaQueryDataResponse } from '@infra/bilo-client';
import {
	BiloBadRequestResponseLoggableException,
	BiloMediaQueryUnprocessableResponseLoggableException,
	BiloNotFoundResponseLoggableException,
} from '@infra/bilo-client/loggable';
import { MediaSource, MediaSourceDataFormat } from '@modules/media-source';
import { Injectable } from '@nestjs/common';
import { MediumMetadataDto } from '../dto';
import {
	MediumMetadataStrategyNotImplementedLoggableException,
	MediumNotFoundLoggableException,
	MediumUnprocessableResponseLoggableException,
} from '../loggable';
import { MediumBadRequestLoggableException } from '../loggable/medium-bad-request-loggable.exception';
import { MediumMetadataMapper } from '../mapper';
import { MediumMetadataStrategy } from './interface';

@Injectable()
export class BiloStrategy implements MediumMetadataStrategy {
	constructor(private readonly biloMediaClientAdapter: BiloMediaClientAdapter) {}

	public getMediaSourceFormat(): MediaSourceDataFormat {
		return MediaSourceDataFormat.BILDUNGSLOGIN;
	}

	public async getMediumMetadataItem(mediumId: string, mediaSource: MediaSource): Promise<MediumMetadataDto> {
		try {
			const metadataItem: BiloMediaQueryDataResponse = await this.biloMediaClientAdapter.fetchMediumMetadata(
				mediumId,
				mediaSource
			);

			const mediumMetadataDto: MediumMetadataDto =
				MediumMetadataMapper.mapBiloMediumMetadataToMediumMetadata(metadataItem);

			return mediumMetadataDto;
		} catch (error) {
			if (error instanceof BiloNotFoundResponseLoggableException) {
				throw new MediumNotFoundLoggableException(mediumId, mediaSource.sourceId);
			} else if (error instanceof BiloBadRequestResponseLoggableException) {
				throw new MediumBadRequestLoggableException(mediumId, mediaSource.sourceId);
			} else if (error instanceof BiloMediaQueryUnprocessableResponseLoggableException) {
				throw new MediumUnprocessableResponseLoggableException(mediumId, mediaSource.sourceId);
			} else {
				throw error;
			}
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars,require-await,@typescript-eslint/require-await
	public async getMediumMetadataItems(mediumIds: string[], mediaSource: MediaSource): Promise<MediumMetadataDto[]> {
		throw new MediumMetadataStrategyNotImplementedLoggableException(MediaSourceDataFormat.BILDUNGSLOGIN);
	}
}
