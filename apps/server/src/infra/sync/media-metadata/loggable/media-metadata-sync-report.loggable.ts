import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { MediaSourceSyncOperationReport, MediaSourceSyncReport } from '@modules/media-source/domain';

export class MediaMetadataSyncReportLoggable implements Loggable {
	constructor(private readonly report: MediaSourceSyncReport) {}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		const message = `Media metadata sync had finished\n${this.formatCountOverview(this.report)}${this.formatOperations(
			this.report.operations
		)}`;

		return {
			message,
			data: {
				report: JSON.stringify(this.report),
			},
		};
	}

	private formatCountOverview(syncReport: MediaSourceSyncReport): string {
		const formattedString =
			`Total media processed: ${syncReport.totalCount}\n` +
			`Total successful sync: ${syncReport.successCount}\n` +
			`Total failed sync: ${syncReport.failedCount}\n` +
			`Total undelivered media: ${syncReport.undeliveredCount}\n`;

		return formattedString;
	}

	private formatOperations(operations: MediaSourceSyncOperationReport[]): string {
		const formattedString = operations
			.map(
				(operation: MediaSourceSyncOperationReport): string =>
					`${operation.operation} Operation, Status: ${operation.status}, Total: ${operation.count}`
			)
			.join('\n');

		return formattedString;
	}
}
