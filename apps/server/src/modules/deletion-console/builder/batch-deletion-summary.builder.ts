import { BatchDeletionSummaryOverallStatus, type BatchDeletionSummary } from '../uc/interface';

export class BatchDeletionSummaryBuilder {
	public static build(executionTimeMilliseconds: number): BatchDeletionSummary {
		return {
			executionTimeMilliseconds,
			overallStatus: BatchDeletionSummaryOverallStatus.FAILURE,
			successCount: 0,
			failureCount: 0,
			details: [],
		};
	}
}
