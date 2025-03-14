import { Logger } from '@core/logger';
import { MediaSourceSyncReport, MediaSourceSyncService } from '@modules/media-source-sync';
import { MediaSourceDataFormat } from '@modules/media-source';
import { Injectable } from '@nestjs/common';
import { MediaMetadataSyncReportLoggable } from '../loggable';

@Injectable()
export class MediaMetadataSyncUc {
	constructor(private readonly logger: Logger, private readonly mediaSourceSyncService: MediaSourceSyncService) {}

	public async syncAllMediaMetadata(dataFormat: MediaSourceDataFormat): Promise<void> {
		const syncReport: MediaSourceSyncReport = await this.mediaSourceSyncService.syncAllMediaMetadata(dataFormat);

		this.logSyncReport(syncReport, dataFormat);
	}

	private logSyncReport(report: MediaSourceSyncReport, mediaSourceDataFormat: MediaSourceDataFormat): void {
		const loggable = new MediaMetadataSyncReportLoggable(report, mediaSourceDataFormat);

		this.logger.info(loggable);
	}
}
