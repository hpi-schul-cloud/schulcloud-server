import { MediaSourceSyncStatus } from '../../enum';
import { MediaSourceSyncOperationReport, MediaSourceSyncReport } from '../interface';

export class MediaSourceSyncReportFactory {
	public static buildFromOperations(operations: MediaSourceSyncOperationReport[]): MediaSourceSyncReport {
		const successCount: number = operations
			.filter((report: MediaSourceSyncOperationReport) => report.status === MediaSourceSyncStatus.SUCCESS)
			.reduce((totalCount: number, success: MediaSourceSyncOperationReport) => {
				totalCount += success.count;
				return totalCount;
			}, 0);

		const failedCount: number = operations
			.filter((report: MediaSourceSyncOperationReport) => report.status === MediaSourceSyncStatus.FAILED)
			.reduce((totalCount: number, failed: MediaSourceSyncOperationReport) => {
				totalCount += failed.count;
				return totalCount;
			}, 0);

		const undeliveredCount: number = operations
			.filter((report: MediaSourceSyncOperationReport) => report.status === MediaSourceSyncStatus.UNDELIVERED)
			.reduce((totalCount: number, undelivered: MediaSourceSyncOperationReport) => {
				totalCount += undelivered.count;
				return totalCount;
			}, 0);

		const totalCount: number = failedCount + successCount + undeliveredCount;

		const report: MediaSourceSyncReport = {
			totalCount,
			successCount,
			failedCount,
			undeliveredCount,
			operations,
		};

		return report;
	}
}
