import { MediaSourceSyncOperation, MediaSourceSyncStatus } from '../../enum';
import { MediaSourceSyncOperationReport } from '../interface';

export class MediaSourceSyncOperationReportFactory {
	static build(
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

	static buildWithSuccessStatus(operation: MediaSourceSyncOperation, count?: number): MediaSourceSyncOperationReport {
		const operationReport: MediaSourceSyncOperationReport = {
			operation,
			status: MediaSourceSyncStatus.SUCCESS,
			count: count ?? 0,
		};

		return operationReport;
	}

	static buildWithFailedStatus(operation: MediaSourceSyncOperation, count?: number): MediaSourceSyncOperationReport {
		const operationReport: MediaSourceSyncOperationReport = {
			operation,
			status: MediaSourceSyncStatus.FAILED,
			count: count ?? 0,
		};

		return operationReport;
	}

	static buildUndeliveredReport(count?: number): MediaSourceSyncOperationReport {
		const operationReport: MediaSourceSyncOperationReport = {
			operation: MediaSourceSyncOperation.ANY,
			status: MediaSourceSyncStatus.UNDELIVERED,
			count: count ?? 0,
		};

		return operationReport;
	}
}
