import { QueueDeletionRequestOutput } from '../../services';

export interface BatchDeletionSummary {
	successCount: number;
	failureCount: number;
	details: QueueDeletionRequestOutput[];
}
