import { Injectable } from '@nestjs/common';
import {
	MediaSource,
	MediaSourceDataFormat,
	MediaSourceService,
	MediaSourceNotFoundLoggableException,
} from '@modules/media-source';
import { MediaSourceSyncStrategy, MediaSourceSyncReport } from '../interface';
import { SyncStrategyNotImplementedLoggableException } from '../loggable';
import { BiloMetadataSyncStrategy } from './strategy';

@Injectable()
export class MediaMetadataSyncService {
	private metadataSyncStrategyMap: Map<MediaSourceDataFormat, MediaSourceSyncStrategy>;

	constructor(
		private readonly mediaSourceService: MediaSourceService,
		private readonly biloSyncStrategy: BiloMetadataSyncStrategy
	) {
		this.metadataSyncStrategyMap = new Map<MediaSourceDataFormat, MediaSourceSyncStrategy>();
		this.metadataSyncStrategyMap.set(this.biloSyncStrategy.getMediaSourceFormat(), this.biloSyncStrategy);
	}

	public async syncAllMediaMetadata(dataFormat: MediaSourceDataFormat): Promise<MediaSourceSyncReport> {
		const strategy = this.metadataSyncStrategyMap.get(dataFormat);

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
