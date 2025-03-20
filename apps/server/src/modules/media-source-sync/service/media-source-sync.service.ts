import {
	MediaSource,
	MediaSourceDataFormat,
	MediaSourceNotFoundLoggableException,
	MediaSourceService,
} from '@modules/media-source';
import { Injectable } from '@nestjs/common';
import { MediaSourceSyncReport, MediaSourceSyncStrategy } from '../interface';
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

	private async getMediaSource(strategy: MediaSourceSyncStrategy): Promise<MediaSource> {
		const format: MediaSourceDataFormat = strategy.getMediaSourceFormat();

		const mediaSource = await this.mediaSourceService.findByFormat(format);

		if (!mediaSource) {
			throw new MediaSourceNotFoundLoggableException(format);
		}

		return mediaSource;
	}
}
