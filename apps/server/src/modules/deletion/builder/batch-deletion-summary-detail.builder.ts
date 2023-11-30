import { QueueDeletionRequestInput, QueueDeletionRequestOutput } from '../services';
import { BatchDeletionSummaryDetail } from '../interface';

export class BatchDeletionSummaryDetailBuilder {
	static build(input: QueueDeletionRequestInput, output: QueueDeletionRequestOutput): BatchDeletionSummaryDetail {
		return { input, output };
	}
}
