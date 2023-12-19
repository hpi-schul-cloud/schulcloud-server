import { QueueDeletionRequestInput, QueueDeletionRequestOutput } from '../../services/interface';

export interface BatchDeletionSummaryDetail {
	input: QueueDeletionRequestInput;
	output: QueueDeletionRequestOutput;
}
