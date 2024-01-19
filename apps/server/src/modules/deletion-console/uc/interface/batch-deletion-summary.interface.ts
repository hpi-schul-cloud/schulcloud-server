import { BatchDeletionSummaryDetail } from './batch-deletion-summary-detail.interface';

export interface BatchDeletionSummary {
	executionTimeMilliseconds: number;
	overallStatus: string;
	successCount: number;
	failureCount: number;
	details: BatchDeletionSummaryDetail[];
}
