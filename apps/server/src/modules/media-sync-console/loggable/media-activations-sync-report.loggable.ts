import { MediaSourceDataFormat } from '@modules/media-source';
import { MediaSourceSyncReport } from '@modules/media-source-sync';
import { LoggableMessage } from '@shared/common/loggable';

export class MediaActivationsSyncReportLoggable {
	constructor(
		private readonly report: MediaSourceSyncReport,
		private readonly mediaSourceDataFormat: MediaSourceDataFormat
	) {}

	public getLogMessage(): LoggableMessage {
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
