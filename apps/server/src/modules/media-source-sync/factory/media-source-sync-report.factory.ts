import { MediaSourceSyncStatus } from '../types';
import { MediaSourceSyncOperationReport, MediaSourceSyncReport } from '../interface';

export class MediaSourceSyncReportFactory {
	public static buildFromOperations(operations: MediaSourceSyncOperationReport[]): MediaSourceSyncReport {
		const successCount: number = this.countReportByStatus(operations, MediaSourceSyncStatus.SUCCESS);
		const failedCount: number = this.countReportByStatus(operations, MediaSourceSyncStatus.FAILED);
		const undeliveredCount: number = this.countReportByStatus(operations, MediaSourceSyncStatus.UNDELIVERED);
		const partialCount: number = this.countReportByStatus(operations, MediaSourceSyncStatus.PARTIAL);

		const totalCount: number = failedCount + successCount + undeliveredCount + partialCount;

		const filteredOperations = operations.filter((report: MediaSourceSyncOperationReport) => report.count > 0);

		const report: MediaSourceSyncReport = {
			totalCount,
			successCount,
			failedCount,
			undeliveredCount,
			partialCount,
			operations: filteredOperations,
		};

		return report;
	}

	public static buildEmptyReport(): MediaSourceSyncReport {
		const report: MediaSourceSyncReport = {
			totalCount: 0,
			successCount: 0,
			undeliveredCount: 0,
			failedCount: 0,
			partialCount: 0,
			operations: [],
		};

		return report;
	}

	private static countReportByStatus(
		operations: MediaSourceSyncOperationReport[],
		status: MediaSourceSyncStatus
	): number {
		const count: number = operations
			.filter((report: MediaSourceSyncOperationReport) => report.status === status)
			.reduce((totalCount: number, report: MediaSourceSyncOperationReport) => {
				totalCount += report.count;
				return totalCount;
			}, 0);

		return count;
	}
}
