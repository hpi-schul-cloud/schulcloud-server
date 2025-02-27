import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { MediaSourceDataFormat } from '@modules/media-source';
import { MediaSourceSyncOperationReport, MediaSourceSyncReport } from '@modules/media-source-sync';

export class MediaMetadataSyncReportLoggable implements Loggable {
	constructor(
		private readonly report: MediaSourceSyncReport,
		private readonly mediaSourceDataFormat: MediaSourceDataFormat
	) {}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		const message = `Media metadata sync for ${this.mediaSourceDataFormat} had finished. ${this.formatCountOverview(
			this.report
		)}${this.formatOperations(this.report.operations)}`;

		return {
			message,
			data: {
				mediaSourceDataFormat: this.mediaSourceDataFormat,
				report: JSON.stringify(this.report),
			},
		};
	}

	private formatCountOverview(syncReport: MediaSourceSyncReport): string {
		const formattedString =
			`Total media found: ${syncReport.totalCount}, ` +
			`Total successful sync: ${syncReport.successCount}, ` +
			`Total failed sync: ${syncReport.failedCount}, ` +
			`Total undelivered media: ${syncReport.undeliveredCount}. `;

		return formattedString;
	}

	private formatOperations(operations: MediaSourceSyncOperationReport[]): string {
		const formattedString = `Operations: ${operations
			.map(
				(operation: MediaSourceSyncOperationReport): string =>
					`Operation: ${operation.operation}; Status: ${operation.status}; Total: ${operation.count}`
			)
			.join(', ')}`;

		return formattedString;
	}
}
