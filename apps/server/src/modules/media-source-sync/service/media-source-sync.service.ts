import {
	MediaSource,
	MediaSourceDataFormat,
	MediaSourceNotFoundLoggableException,
	MediaSourceService,
} from '@modules/media-source';
import { Injectable } from '@nestjs/common';
import { MediaSourceSyncReport, MediaMetadataSyncStrategy, MediaActivationSyncStrategy } from '../interface';
import { SyncStrategyNotImplementedLoggableException } from '../loggable';
import { BiloMetadataSyncStrategy, VidisActivationSyncStrategy, VidisMetadataSyncStrategy } from './strategy';

@Injectable()
export class MediaSourceSyncService {
	private metadataSyncStrategyMap: Map<MediaSourceDataFormat, MediaMetadataSyncStrategy>;
	private activationSyncStrategyMap: Map<MediaSourceDataFormat, MediaActivationSyncStrategy>;

	constructor(
		private readonly mediaSourceService: MediaSourceService,
		private readonly biloMetadataSyncStrategy: BiloMetadataSyncStrategy,
		private readonly vidisMetadataSyncStrategy: VidisMetadataSyncStrategy,
		private readonly vidisActivationSyncStrategy: VidisActivationSyncStrategy
	) {
		this.metadataSyncStrategyMap = new Map<MediaSourceDataFormat, MediaMetadataSyncStrategy>();
		this.metadataSyncStrategyMap.set(
			this.biloMetadataSyncStrategy.getMediaSourceFormat(),
			this.biloMetadataSyncStrategy
		);
		this.metadataSyncStrategyMap.set(
			this.vidisMetadataSyncStrategy.getMediaSourceFormat(),
			this.vidisMetadataSyncStrategy
		);

		this.activationSyncStrategyMap = new Map<MediaSourceDataFormat, MediaActivationSyncStrategy>();
		this.activationSyncStrategyMap.set(
			this.vidisActivationSyncStrategy.getMediaSourceFormat(),
			this.vidisActivationSyncStrategy
		);
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

	public async syncAllMediaActivations(dataFormat: MediaSourceDataFormat): Promise<MediaSourceSyncReport> {
		const strategy = this.activationSyncStrategyMap.get(dataFormat);

		if (!strategy) {
			throw new SyncStrategyNotImplementedLoggableException(dataFormat);
		}

		const mediaSource = await this.getMediaSource(strategy);

		const report: MediaSourceSyncReport = await strategy.syncAllMediaActivations(mediaSource);

		return report;
	}

	private async getMediaSource(
		strategy: MediaMetadataSyncStrategy | MediaActivationSyncStrategy
	): Promise<MediaSource> {
		const format: MediaSourceDataFormat = strategy.getMediaSourceFormat();

		const mediaSource = await this.mediaSourceService.findByFormat(format);

		if (!mediaSource) {
			throw new MediaSourceNotFoundLoggableException(format);
		}

		return mediaSource;
	}
}
