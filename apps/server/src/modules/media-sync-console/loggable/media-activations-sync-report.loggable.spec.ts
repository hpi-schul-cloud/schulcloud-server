import { LogMessage } from '@core/logger';
import { MediaSourceDataFormat } from '@modules/media-source';
import { MediaSourceSyncOperation, MediaSourceSyncStatus } from '@modules/media-source-sync';
import {
	mediaSourceSyncOperationReportFactory,
	mediaSourceSyncReportFactory,
} from '@modules/media-source-sync/testing';
import { MediaActivationsSyncReportLoggable } from './media-activations-sync-report.loggable';

describe(MediaActivationsSyncReportLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const format = MediaSourceDataFormat.VIDIS;

			const success = mediaSourceSyncOperationReportFactory.build({
				status: MediaSourceSyncStatus.SUCCESS,
				operation: MediaSourceSyncOperation.CREATE,
				count: 5,
			});
			const report = mediaSourceSyncReportFactory.withOthersEmpty({ successCount: 5, operations: [success] }).build();

			const loggable = new MediaActivationsSyncReportLoggable(report, format);

			return {
				loggable,
				report,
				format,
			};
		};

		it('should return the correct log message', () => {
			const { loggable, report, format } = setup();

			const result = loggable.getLogMessage();

			expect(result).toEqual<LogMessage>({
				message: `Media activations sync for ${format} had finished with ${report.successCount} activations synced.`,
				data: {
					mediaSourceDataFormat: format,
					report: JSON.stringify(report),
				},
			});
		});
	});
});
