import { QueueDeletionRequestOutput } from '../../services';

export interface BatchDeletionSummary {
	SuccessCount: number;
	FailureCount: number;
	Details: QueueDeletionRequestOutput[];
}
