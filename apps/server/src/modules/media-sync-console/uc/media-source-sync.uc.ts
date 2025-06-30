import { Logger } from '@core/logger';
import { MediaSourceSyncReport, MediaSourceSyncService } from '@modules/media-source-sync';
import { MediaSourceDataFormat } from '@modules/media-source';
import { Injectable } from '@nestjs/common';
import { MediaMetadataSyncReportLoggable, MediaActivationsSyncReportLoggable } from '../loggable';

@Injectable()
export class MediaSourceSyncUc {
	constructor(private readonly logger: Logger, private readonly mediaSourceSyncService: MediaSourceSyncService) {}

	public async syncAllMediaMetadata(dataFormat: MediaSourceDataFormat): Promise<void> {
		const syncReport: MediaSourceSyncReport = await this.mediaSourceSyncService.syncAllMediaMetadata(dataFormat);

		const loggable = new MediaMetadataSyncReportLoggable(syncReport, dataFormat);

		this.logger.info(loggable);
	}

	public async syncAllMediaActivations(dataFormat: MediaSourceDataFormat): Promise<void> {
		const syncReport: MediaSourceSyncReport = await this.mediaSourceSyncService.syncAllMediaActivations(dataFormat);

		const loggable = new MediaActivationsSyncReportLoggable(syncReport, dataFormat);

		this.logger.info(loggable);
	}
}
