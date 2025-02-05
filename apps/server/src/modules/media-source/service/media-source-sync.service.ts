import { Injectable } from '@nestjs/common';
import { MediaSourceSyncStrategy, MediaSourceSyncReport } from '../domain';
import { MediaSourceDataFormat } from '../enum';
import { MediaSourceSyncStrategyNotImplementedLoggableException } from '../loggable';
import { BiloSyncStrategy } from '../strategy';

@Injectable()
export class MediaSourceSyncService {
	private syncStrategyMap: Map<MediaSourceDataFormat, MediaSourceSyncStrategy>;

	constructor(private readonly biloSyncStrategy: BiloSyncStrategy) {
		this.syncStrategyMap = new Map<MediaSourceDataFormat, MediaSourceSyncStrategy>();
		this.syncStrategyMap.set(biloSyncStrategy.getMediaSourceFormat(), this.biloSyncStrategy);
	}

	public async syncAllMediaMetadata(dataFormat: MediaSourceDataFormat): Promise<MediaSourceSyncReport> {
		const strategy = this.syncStrategyMap.get(dataFormat);

		if (!strategy) {
			throw new MediaSourceSyncStrategyNotImplementedLoggableException(dataFormat);
		}

		const report: MediaSourceSyncReport = await strategy.syncAllMediaMetadata();

		return report;
	}
}
