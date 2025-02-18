import { Injectable } from '@nestjs/common';
import {
	MediaSource,
	MediaSourceDataFormat,
	MediaSourceService,
	MediaSourceNotFoundLoggableException,
} from '@modules/media-source';
import { MediaMetadataDto } from '../dto';
import { MediaSourceSyncStrategy, MediaSourceSyncReport } from '../interface';
import { SyncStrategyNotImplementedLoggableException } from '../loggable';
import { BiloSyncStrategy } from './strategy';

@Injectable()
export class MediaSourceSyncService {
	private syncStrategyMap: Map<MediaSourceDataFormat, MediaSourceSyncStrategy>;

	constructor(
		private readonly mediaSourceService: MediaSourceService,
		private readonly biloSyncStrategy: BiloSyncStrategy
	) {
		this.syncStrategyMap = new Map<MediaSourceDataFormat, MediaSourceSyncStrategy>();
		this.syncStrategyMap.set(this.biloSyncStrategy.getMediaSourceFormat(), this.biloSyncStrategy);
	}

	public async syncAllMediaMetadata(dataFormat: MediaSourceDataFormat): Promise<MediaSourceSyncReport> {
		const strategy = this.syncStrategyMap.get(dataFormat);

		if (!strategy) {
			throw new SyncStrategyNotImplementedLoggableException(dataFormat);
		}

		const mediaSource = await this.getMediaSource(strategy);

		const report: MediaSourceSyncReport = await strategy.syncAllMediaMetadata(mediaSource);

		return report;
	}

	public async fetchMediumMetadata(
		mediumId: string,
		dataFormat: MediaSourceDataFormat | undefined
	): Promise<MediaMetadataDto> {
		if (!dataFormat) {
			// TODO: loggableException
			throw new Error('Data format is required');
		}

		const strategy = this.syncStrategyMap.get(dataFormat);

		if (!strategy) {
			throw new SyncStrategyNotImplementedLoggableException(dataFormat);
		}

		const mediaSource: MediaSource = await this.getMediaSource(strategy);

		const mediaMetadata: MediaMetadataDto = await strategy.fetchMediaMetadata(mediumId, mediaSource);

		return mediaMetadata;
	}

	private async getMediaSource(strategy: MediaSourceSyncStrategy): Promise<MediaSource> {
		const format: MediaSourceDataFormat = strategy.getMediaSourceFormat();

		const mediaSource = await this.mediaSourceService.findByFormat(format);

		if (!mediaSource) {
			throw new MediaSourceNotFoundLoggableException(format);
		}

		return mediaSource;
	}
}
