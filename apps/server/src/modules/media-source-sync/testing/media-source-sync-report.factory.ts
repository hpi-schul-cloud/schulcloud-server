import { Factory } from 'fishery';
import { mediaSourceSyncOperationReportFactory } from './media-source-sync-operation-report.factory';
import { MediaSourceSyncReport } from '../interface';

class MediaSourceSyncReportFactory extends Factory<MediaSourceSyncReport, MediaSourceSyncReport> {
	public withOthersEmpty(report: Partial<MediaSourceSyncReport>): this {
		const params: MediaSourceSyncReport = {
			totalCount: report.totalCount ?? 0,
			successCount: report.successCount ?? 0,
			failedCount: report.failedCount ?? 0,
			undeliveredCount: report.undeliveredCount ?? 0,
			partialCount: report.partialCount ?? 0,
			operations: report.operations ?? [],
		};

		return this.params(params);
	}
}

export const mediaSourceSyncReportFactory = MediaSourceSyncReportFactory.define(() => {
	const syncReport: MediaSourceSyncReport = {
		totalCount: 10,
		successCount: 10,
		failedCount: 0,
		undeliveredCount: 0,
		partialCount: 0,
		operations: mediaSourceSyncOperationReportFactory.buildList(1),
	};

	return syncReport;
});
