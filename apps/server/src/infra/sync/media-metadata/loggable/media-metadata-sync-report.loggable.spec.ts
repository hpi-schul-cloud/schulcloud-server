import { MediaSourceDataFormat } from '@modules/media-source';
import { MediaSourceSyncOperationReport } from '@modules/media-source-sync';
import { mediaSourceSyncReportFactory } from '@modules/media-source-sync/testing';
import { MediaMetadataSyncReportLoggable } from './media-metadata-sync-report.loggable';

describe(MediaMetadataSyncReportLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const report = mediaSourceSyncReportFactory.build();
			const mediaSourceDataFormat = MediaSourceDataFormat.BILDUNGSLOGIN;

			const loggable = new MediaMetadataSyncReportLoggable(report, mediaSourceDataFormat);

			let expectedMessage =
				`Media metadata sync for ${mediaSourceDataFormat} had finished.\n` +
				`Total media processed: ${report.totalCount}\n` +
				`Total successful sync: ${report.successCount}\n` +
				`Total failed sync: ${report.failedCount}\n` +
				`Total undelivered media: ${report.undeliveredCount}\n`;

			const operationsString = report.operations
				.map(
					(operation: MediaSourceSyncOperationReport): string =>
						`${operation.operation} operation, Status: ${operation.status}, Total: ${operation.count}`
				)
				.join('\n');

			expectedMessage += operationsString;

			return {
				loggable,
				expectedMessage,
				report,
				mediaSourceDataFormat,
			};
		};

		it('should return the correct log message', () => {
			const { loggable, expectedMessage, report, mediaSourceDataFormat } = setup();

			const logMessage = loggable.getLogMessage();

			expect(logMessage).toEqual({
				message: expectedMessage,
				data: {
					mediaSourceDataFormat,
					report: JSON.stringify(report),
				},
			});
		});
	});
});
