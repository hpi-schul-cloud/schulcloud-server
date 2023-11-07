import { QueueDeletionRequestInput, QueueDeletionRequestOutput } from '../../services';

export interface BatchDeletionSummaryDetail {
	input: QueueDeletionRequestInput;
	output: QueueDeletionRequestOutput;
}

export interface BatchDeletionSummary {
	executionTimeMilliseconds: number;
	overallStatus: string;
	successCount: number;
	failureCount: number;
	details: BatchDeletionSummaryDetail[];
}
