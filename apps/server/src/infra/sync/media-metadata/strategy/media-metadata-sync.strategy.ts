import { Injectable } from '@nestjs/common';
import { Logger } from '@core/logger';
import { MediaSourceDataFormat } from '@modules/media-source';
import { MediaMetadataSyncService, MediaSourceSyncReport } from '@modules/media-source-sync';
import { MediaMetadataSyncReportLoggable } from '@modules/media-sync-console/loggable';
import { SyncStrategy } from '../../strategy/sync-strategy';
import { SyncStrategyTarget } from '../../sync-strategy.types';

@Injectable()
export class MediaMetadataSyncStrategy implements SyncStrategy {
	constructor(private readonly mediaSourceSyncService: MediaMetadataSyncService, private readonly logger: Logger) {}

	public getType(): SyncStrategyTarget {
		return SyncStrategyTarget.MEDIA_METADATA;
	}

	public async sync(): Promise<void> {
		const mediaSourceDataFormatsToSync: MediaSourceDataFormat[] = [MediaSourceDataFormat.BILDUNGSLOGIN];

		const syncPromises = mediaSourceDataFormatsToSync.map(async (dataFormat: MediaSourceDataFormat): Promise<void> => {
			const report: MediaSourceSyncReport = await this.mediaSourceSyncService.syncAllMediaMetadata(dataFormat);

			this.logSyncReport(report, dataFormat);
		});

		await Promise.all(syncPromises);
	}

	private logSyncReport(report: MediaSourceSyncReport, mediaSourceDataFormat: MediaSourceDataFormat): void {
		const loggable = new MediaMetadataSyncReportLoggable(report, mediaSourceDataFormat);

		this.logger.info(loggable);
	}
}
