import { LogMessage } from '@core/logger';
import { MediaSourceDataFormat } from '@modules/media-source';
import { MediaSourceSyncReport } from '@modules/media-source-sync';

export class MediaActivationsSyncReportLoggable {
	constructor(
		private readonly report: MediaSourceSyncReport,
		private readonly mediaSourceDataFormat: MediaSourceDataFormat
	) {}

	public getLogMessage(): LogMessage {
		const message = `Media activations sync for ${this.mediaSourceDataFormat} had finished with ${this.report.successCount} activations synced.`;

		return {
			message,
			data: {
				mediaSourceDataFormat: this.mediaSourceDataFormat,
				report: JSON.stringify(this.report),
			},
		};
	}
}
