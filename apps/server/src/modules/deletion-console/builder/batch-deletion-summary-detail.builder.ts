import { QueueDeletionRequestInput, QueueDeletionRequestOutput } from '../services/interface';
import { BatchDeletionSummaryDetail } from '../uc/interface';

export class BatchDeletionSummaryDetailBuilder {
	static build(input: QueueDeletionRequestInput, output: QueueDeletionRequestOutput): BatchDeletionSummaryDetail {
		return { input, output };
	}
}
