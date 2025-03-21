import { MediaSourceSyncOperationReport } from './media-source-sync-operation-report';

export interface MediaSourceSyncReport {
	totalCount: number;
	successCount: number;
	failedCount: number;
	undeliveredCount: number;
	partialCount: number;
	operations: MediaSourceSyncOperationReport[];
}
