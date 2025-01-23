import { MediaSourceSyncOperationReport } from '@modules/media-source/domain';
import { mediaSourceSyncReportFactory } from '@modules/media-source/testing';
import { MediaMetadataSyncReportLoggable } from './media-metadata-sync-report.loggable';

describe(MediaMetadataSyncReportLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const report = mediaSourceSyncReportFactory.build();

			const loggable = new MediaMetadataSyncReportLoggable(report);

			let expectedMessage =
				'Media metadata sync had finished\n' +
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
				report,
				expectedMessage,
			};
		};

		it('should return the correct log message', () => {
			const { loggable, report, expectedMessage } = setup();

			const logMessage = loggable.getLogMessage();

			expect(logMessage).toEqual({
				message: expectedMessage,
				data: {
					report: JSON.stringify(report),
				},
			});
		});
	});
});
