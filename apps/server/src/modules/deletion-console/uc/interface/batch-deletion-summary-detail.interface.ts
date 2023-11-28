import { QueueDeletionRequestInput, QueueDeletionRequestOutput } from '../../../deletion/services';

export interface BatchDeletionSummaryDetail {
	input: QueueDeletionRequestInput;
	output: QueueDeletionRequestOutput;
}
