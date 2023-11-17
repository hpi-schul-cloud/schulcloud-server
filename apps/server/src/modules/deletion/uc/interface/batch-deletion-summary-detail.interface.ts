import { QueueDeletionRequestInput, QueueDeletionRequestOutput } from '../../services';

export interface BatchDeletionSummaryDetail {
	input: QueueDeletionRequestInput;
	output: QueueDeletionRequestOutput;
}
