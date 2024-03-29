import { BatchDeletionSummaryOverallStatus, BatchDeletionSummary } from '../uc/interface';

export class BatchDeletionSummaryBuilder {
	static build(executionTimeMilliseconds: number): BatchDeletionSummary {
		return {
			executionTimeMilliseconds,
			overallStatus: BatchDeletionSummaryOverallStatus.FAILURE,
			successCount: 0,
			failureCount: 0,
			details: [],
		};
	}
}
