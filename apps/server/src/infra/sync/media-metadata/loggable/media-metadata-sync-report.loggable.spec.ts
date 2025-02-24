import { LogMessage } from '@core/logger';
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
				`Media metadata sync for ${mediaSourceDataFormat} had finished. ` +
				`Total media found: ${report.totalCount}, ` +
				`Total successful sync: ${report.successCount}, ` +
				`Total failed sync: ${report.failedCount}, ` +
				`Total undelivered media: ${report.undeliveredCount}. ` +
				`Operations: `;

			const operationsString = report.operations
				.map(
					(operation: MediaSourceSyncOperationReport): string =>
						`Operation: ${operation.operation}; Status: ${operation.status}; Total: ${operation.count}`
				)
				.join(', ');

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
			} as LogMessage);
		});
	});
});
