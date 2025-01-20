import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { MediaSourceSyncService } from '@modules/media-source/service';
import { MediaSourceSyncReport } from '@modules/media-source/domain';
import { SyncStrategy } from '../../strategy/sync-strategy';
import { SyncStrategyTarget } from '../../sync-strategy.types';
import { MediaMetadataSyncReportLoggable } from '../loggable';

@Injectable()
export class MediaMetadataSyncStrategy implements SyncStrategy {
	constructor(private readonly mediaSourceSyncService: MediaSourceSyncService, private readonly logger: Logger) {}

	public getType(): SyncStrategyTarget {
		return SyncStrategyTarget.MEDIA_METADATA;
	}

	public async sync(): Promise<void> {
		const report: MediaSourceSyncReport = await this.mediaSourceSyncService.syncAllMediaMetadata();

		this.logSyncReport(report);
	}

	private logSyncReport(report: MediaSourceSyncReport): void {
		const loggable = new MediaMetadataSyncReportLoggable(report);

		this.logger.info(loggable);
	}
}
