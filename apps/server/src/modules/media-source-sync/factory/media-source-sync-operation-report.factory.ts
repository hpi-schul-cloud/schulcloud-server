import { MediaSourceSyncOperation, MediaSourceSyncStatus } from '../types';
import { MediaSourceSyncOperationReport } from '../interface';

export class MediaSourceSyncOperationReportFactory {
	public static build(
		operation: MediaSourceSyncOperation,
		status: MediaSourceSyncStatus,
		count?: number
	): MediaSourceSyncOperationReport {
		const operationReport: MediaSourceSyncOperationReport = {
			operation,
			status,
			count: count ?? 0,
		};

		return operationReport;
	}

	public static buildWithSuccessStatus(
		operation: MediaSourceSyncOperation,
		count?: number
	): MediaSourceSyncOperationReport {
		const operationReport: MediaSourceSyncOperationReport = {
			operation,
			status: MediaSourceSyncStatus.SUCCESS,
			count: count ?? 0,
		};

		return operationReport;
	}

	public static buildWithFailedStatus(
		operation: MediaSourceSyncOperation,
		count?: number
	): MediaSourceSyncOperationReport {
		const operationReport: MediaSourceSyncOperationReport = {
			operation,
			status: MediaSourceSyncStatus.FAILED,
			count: count ?? 0,
		};

		return operationReport;
	}

	public static buildUndeliveredReport(count?: number): MediaSourceSyncOperationReport {
		const operationReport: MediaSourceSyncOperationReport = {
			operation: MediaSourceSyncOperation.ANY,
			status: MediaSourceSyncStatus.UNDELIVERED,
			count: count ?? 0,
		};

		return operationReport;
	}

	public static buildWithPartialStatus(
		operation: MediaSourceSyncOperation,
		count?: number
	): MediaSourceSyncOperationReport {
		const operationReport: MediaSourceSyncOperationReport = {
			operation: operation,
			status: MediaSourceSyncStatus.PARTIAL,
			count: count ?? 0,
		};

		return operationReport;
	}
}
