import { type QueueDeletionRequestInput, type QueueDeletionRequestOutput } from '../services/interface';
import { type BatchDeletionSummaryDetail } from '../uc/interface';

export class BatchDeletionSummaryDetailBuilder {
	static build(input: QueueDeletionRequestInput, output: QueueDeletionRequestOutput): BatchDeletionSummaryDetail {
		return { input, output };
	}
}
